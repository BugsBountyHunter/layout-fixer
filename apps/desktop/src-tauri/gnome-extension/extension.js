// GNOME Shell keeps the current input source itself and puts back its own XKB layout when another
// app changes it, so Layout Fixer for desktop switches layouts through this extension instead. It
// only lists the input sources and activates one; it never sees what the user types.
import Gio from 'gi://Gio'
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import { getInputSourceManager } from 'resource:///org/gnome/shell/ui/status/keyboard.js'

const PATH = '/org/gnome/Shell/Extensions/LayoutFixer'
const INTERFACE = `<node>
  <interface name="org.gnome.Shell.Extensions.LayoutFixer">
    <method name="List">
      <arg type="a(ssub)" direction="out" name="sources"/>
    </method>
    <method name="Activate">
      <arg type="u" direction="in" name="index"/>
    </method>
  </interface>
</node>`

class InputSources {
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
}

export default class LayoutFixerExtension extends Extension {
  enable() {
    this._object = Gio.DBusExportedObject.wrapJSObject(INTERFACE, new InputSources())
    this._object.export(Gio.DBus.session, PATH)
  }

  disable() {
    this._object?.unexport()
    this._object = null
  }
}
