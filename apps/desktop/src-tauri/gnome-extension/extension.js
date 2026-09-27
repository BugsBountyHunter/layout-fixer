// GNOME lets apps neither switch the input source (the Shell keeps its own and Mutter puts back its
// XKB layout) nor, on Wayland, press keys in other apps, read the clipboard in the background or
// grab a global shortcut. Layout Fixer for desktop does those through this extension. It only
// acts when the app asks, for the fix the user started with the shortcut.
import Clutter from 'gi://Clutter'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import Meta from 'gi://Meta'
import Shell from 'gi://Shell'
import St from 'gi://St'
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import { getInputSourceManager } from 'resource:///org/gnome/shell/ui/status/keyboard.js'

/** Bumped whenever the D-Bus interface changes; the app asks the user to log out when it's older. */
const API_VERSION = 2
const PATH = '/org/gnome/Shell/Extensions/LayoutFixer'
const INTERFACE = `<node>
  <interface name="org.gnome.Shell.Extensions.LayoutFixer">
    <method name="ApiVersion"><arg type="u" direction="out" name="version"/></method>
    <method name="List"><arg type="a(ssub)" direction="out" name="sources"/></method>
    <method name="Activate"><arg type="u" direction="in" name="index"/></method>
    <method name="Copy"/>
    <method name="Paste"/>
    <method name="ClipboardSerial"><arg type="u" direction="out" name="serial"/></method>
    <method name="ReadClipboard"><arg type="a{say}" direction="out" name="content"/></method>
    <method name="WriteClipboard"><arg type="a{say}" direction="in" name="content"/></method>
    <method name="SetShortcut">
      <arg type="s" direction="in" name="accelerator"/>
      <arg type="b" direction="out" name="grabbed"/>
    </method>
    <signal name="Activated"/>
  </interface>
</node>`

// Evdev keycodes name physical keys, so Ctrl+C works whichever layout is active, Arabic included.
const KEY_LEFTCTRL = 29
const KEY_C = 46
const KEY_V = 47
const HELD_MODIFIERS =
  Clutter.ModifierType.SHIFT_MASK |
  Clutter.ModifierType.CONTROL_MASK |
  Clutter.ModifierType.MOD1_MASK |
  Clutter.ModifierType.SUPER_MASK |
  Clutter.ModifierType.META_MASK
const MODIFIER_WAIT_MS = 600
const POLL_MS = 10
/** What a fix copies and restores; St.Clipboard can put back one type, the first one present. */
const CLIPBOARD_TYPES = ['text/plain;charset=utf-8', 'text/plain', 'text/html', 'image/png']

const delay = (ms) =>
  new Promise((resolve) =>
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
      resolve()
      return GLib.SOURCE_REMOVE
    }),
  )

function readType(type) {
  return new Promise((resolve) =>
    St.Clipboard.get_default().get_content(St.ClipboardType.CLIPBOARD, type, (_clipboard, bytes) =>
      resolve(bytes?.get_size() ? bytes.toArray() : null),
    ),
  )
}

class LayoutFixerService {
  constructor() {
    const backend = global.stage.context?.get_backend?.() ?? Clutter.get_default_backend()
    this._keyboard = backend.get_default_seat().create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE)
    this._serial = 0
    this._selection = global.display.get_selection()
    this._ownerChangedId = this._selection.connect('owner-changed', (_selection, type) => {
      if (type === Meta.SelectionType.SELECTION_CLIPBOARD) this._serial++
    })
    this._action = Meta.KeyBindingAction.NONE
    this._accelerator = ''
    this._activatedId = global.display.connect('accelerator-activated', (_display, action) => {
      if (action === this._action) this.object?.emit_signal('Activated', null)
    })
    this._watchId = 0
    this.object = null
  }

  destroy() {
    this._releaseShortcut()
    this._selection.disconnect(this._ownerChangedId)
    global.display.disconnect(this._activatedId)
    this._keyboard.run_dispose()
  }

  ApiVersion() {
    return API_VERSION
  }

  /** Type (`xkb`, `ibus`), id (`ara+mac`), index, and whether it is the current source. */
  List() {
    const manager = getInputSourceManager()
    return Object.values(manager.inputSources).map((source) => [
      source.type,
      source.id,
      source.index,
      source === manager.currentSource,
    ])
  }

  /** Like picking the source from the top bar, so the MRU order and the indicator follow. */
  Activate(index) {
    const source = getInputSourceManager().inputSources[index]
    if (!source) throw new Error(`No input source at index ${index}`)
    source.activate(true)
  }

  CopyAsync(_params, invocation) {
    this._ctrlChord(KEY_C).then(
      () => invocation.return_value(null),
      (error) => invocation.return_error_literal(Gio.DBusError, Gio.DBusError.FAILED, `${error}`),
    )
  }

  PasteAsync(_params, invocation) {
    this._ctrlChord(KEY_V).then(
      () => invocation.return_value(null),
      (error) => invocation.return_error_literal(Gio.DBusError, Gio.DBusError.FAILED, `${error}`),
    )
  }

  /** Counts clipboard owner changes, so the app sees when the focused app has answered Ctrl+C. */
  ClipboardSerial() {
    return this._serial
  }

  ReadClipboardAsync(_params, invocation) {
    const offered = St.Clipboard.get_default().get_mimetypes(St.ClipboardType.CLIPBOARD)
    const types = CLIPBOARD_TYPES.filter((type) => offered.includes(type))
    Promise.all(types.map(readType)).then((contents) => {
      const found = Object.fromEntries(
        types.flatMap((type, index) => (contents[index] ? [[type, contents[index]]] : [])),
      )
      invocation.return_value(new GLib.Variant('(a{say})', [found]))
    })
  }

  // The arguments are read from the message: the plain `WriteClipboard(content)` form hands over
  // byte arrays that point into freed memory.
  WriteClipboardAsync(_params, invocation) {
    const [content] = invocation.get_parameters().deepUnpack()
    const type = CLIPBOARD_TYPES.find((candidate) => content[candidate])
    if (type) {
      // Owned by GLib: GJS can make GBytes that share the array's memory, which the JS garbage
      // collector frees while the clipboard still serves it.
      const bytes = new GLib.Variant('ay', content[type]).get_data_as_bytes()
      St.Clipboard.get_default().set_content(St.ClipboardType.CLIPBOARD, type, bytes)
    }
    invocation.return_value(null)
  }

  /**
   * Grabs `accelerator` (`<Alt><Shift>f`) for the calling app, until it quits or grabs another; an
   * empty one releases it. Asking again for the one already held changes nothing, so the app can
   * keep asserting it (the grab is lost when the extension is turned off and on).
   */
  SetShortcutAsync([accelerator], invocation) {
    if (accelerator && accelerator === this._accelerator && this._action !== Meta.KeyBindingAction.NONE) {
      invocation.return_value(new GLib.Variant('(b)', [true]))
      return
    }
    this._releaseShortcut()
    const action = accelerator ? global.display.grab_accelerator(accelerator, Meta.KeyBindingFlags.NONE) : 0
    if (action !== Meta.KeyBindingAction.NONE) {
      this._action = action
      this._accelerator = accelerator
      Main.wm.allowKeybinding(
        Meta.external_binding_name_for_action(action),
        Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
      )
      this._watchId = Gio.bus_watch_name_on_connection(
        invocation.get_connection(),
        invocation.get_sender(),
        Gio.BusNameWatcherFlags.NONE,
        null,
        () => this._releaseShortcut(),
      )
    }
    invocation.return_value(new GLib.Variant('(b)', [action !== Meta.KeyBindingAction.NONE]))
  }

  _releaseShortcut() {
    if (this._watchId) Gio.bus_unwatch_name(this._watchId)
    this._watchId = 0
    if (this._action !== Meta.KeyBindingAction.NONE) global.display.ungrab_accelerator(this._action)
    this._action = Meta.KeyBindingAction.NONE
    this._accelerator = ''
  }

  /** The user may still hold the shortcut's Alt+Shift; give them a moment to let go first. */
  async _ctrlChord(letter) {
    for (let waited = 0; waited < MODIFIER_WAIT_MS; waited += POLL_MS) {
      const [, , modifiers] = global.get_pointer()
      if ((modifiers & HELD_MODIFIERS) === 0) break
      await delay(POLL_MS)
    }
    const press = (key, state) => this._keyboard.notify_key(GLib.get_monotonic_time(), key, state)
    press(KEY_LEFTCTRL, Clutter.KeyState.PRESSED)
    press(letter, Clutter.KeyState.PRESSED)
    press(letter, Clutter.KeyState.RELEASED)
    press(KEY_LEFTCTRL, Clutter.KeyState.RELEASED)
  }
}

export default class LayoutFixerExtension extends Extension {
  enable() {
    this._service = new LayoutFixerService()
    this._service.object = Gio.DBusExportedObject.wrapJSObject(INTERFACE, this._service)
    this._service.object.export(Gio.DBus.session, PATH)
  }

  disable() {
    this._service?.object?.unexport()
    this._service?.destroy()
    this._service = null
  }
}
