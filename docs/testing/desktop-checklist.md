# Desktop app — manual checklist

Run on each OS before a desktop release. Build with `npm run desktop:build`; on macOS sign local builds
(see "Local macOS signing" in CLAUDE.md) so the Accessibility permission survives rebuilds.

Legend: ✅ checked on macOS 27 (Apple silicon, built-in 2× display + external 1× display) on 2026-09-26.

## App lifecycle

- [x] ✅ Starts in the menu bar / tray, no Dock icon (macOS)
- [x] ✅ Tray menu: Fix Selection (shows ⌥⇧F), Settings…, Quit Layout Fixer
- [x] ✅ Settings… opens the window; closing it hides it and the app keeps running
- [x] ✅ Quit exits; relaunch starts quietly in the tray
- [x] ✅ Launching a second copy opens Settings instead of starting another process
- [x] ✅ Arabic layout choice survives a restart

## First run, language and settings (phase 5)

- [x] ✅ First launch opens the welcome (permission status, practice field, Done); later launches start quietly
- [x] ✅ Practice field: select `hgsghl ugd;l`, press the shortcut → `السلام عليكم`
- [x] ✅ Language العربية: the whole window and the tray menu switch at once, no restart; "Same as system" follows macOS
- [ ] Arabic window reads right to left (headings, rows, checkmarks on the leading side)
- [x] ✅ Pause in the tray releases the shortcut (⌥⇧F reaches the app); Resume restores it; the item's label follows
- [x] ✅ Shortcut recorder: ⌃⌥K saved and working, the old shortcut released, kept after a restart; Reset restores ⌥⇧F
- [ ] Recorder refuses ⌘C (reserved), a bare letter (needs a modifier) and a shortcut another app owns (e.g. ⌘Space)
- [x] ✅ Open at login creates the LaunchAgent; switching it off removes it
- [x] ✅ On-screen messages off: an empty selection shows nothing; on: the message shows

## Permission (macOS)

- [x] ✅ Without Accessibility: the shortcut shows a message, the system prompt, and Settings with an **Allow…** button;
      the selected text is not changed
- [x] ✅ After switching Accessibility on, the fix works without restarting the app
- [x] ✅ A rebuild signed with the same certificate keeps the permission

## Fixing text

- [x] ✅ TextEdit: `hgsghl ugd;l` → `السلام عليكم` (PC layout) and the macOS-layout equivalent with Automatic
- [x] ✅ Arabic typed on the English layout → English (`اثممخ صخقمي` → `hello world`, Mac layout)
- [x] ✅ ⌘Z / Ctrl+Z restores the original in one step
- [x] ✅ Nothing selected: message "Select the text first", text and clipboard unchanged
- [x] ✅ Nothing to fix (`123 456`): message "Nothing to fix", clipboard unchanged
- [x] ✅ The user's clipboard is restored after a fix: plain text, and rich text (RTF) byte for byte
- [x] ✅ The target app keeps focus; the message pill never takes it
- [x] ✅ Message pill appears on the screen with the pointer, centered, 140 pt above the bottom (mixed 2×/1× displays)
- [x] ✅ Password field: macOS Secure Input doesn't deliver the shortcut at all (it types `Ï`); the clipboard is untouched
- [ ] Clipboard with an image, and with copied files (Finder), restored after a fix
- [ ] VS Code: nothing selected → "Select the text first" (VS Code would otherwise copy the whole line)
- [ ] Word, Pages, Notes, Slack, WhatsApp, Mail, Terminal
- [ ] Chrome and Safari text fields, with and without the extension installed
- [ ] A clipboard manager (e.g. Maccy, Raycast) does not record the fixed text
- [ ] Message pill: light and dark mode, readable on busy backgrounds
- [x] ✅ VoiceOver: every message is posted as a high-priority announcement (verified with an AXObserver listening for
      `AXAnnouncementRequested`, the notification VoiceOver speaks)
- [ ] With VoiceOver on: the message is spoken while TextEdit keeps focus
- [ ] Narrator (Windows) and Orca (Linux) read the message pill's live region

## Keyboard layout switching (macOS; Windows and Linux are in their sections)

- [x] ✅ The real TIS switch: ABC → Arabic → back (`cargo test -- --ignored --test-threads=1 switches_the_real_layout`)
- [ ] TextEdit on ABC: fix `hgsghl` → Arabic text, and the menu-bar input source is now Arabic
- [ ] Fix `اثممخ` on Arabic → `hello`, and the input source is back on ABC / U.S.
- [ ] Target layout already active (fix English text while on ABC): nothing changes
- [ ] Only ABC enabled (no Arabic layout): the fix works, the layout stays, no message
- [ ] Settings → General → switch off: the fix works and the layout stays
- [ ] With "Automatically switch to a document's input source" on: the new layout sticks in that window
- [ ] Chrome, Slack, VS Code: the next keystrokes come out in the new layout
- [x] ✅ Settings, Arabic layout set to PC with only the Mac Arabic layout enabled: "Your computer has the Mac Arabic
      layout…" with a "Use Mac" button; clicking it saves `ar-mac` and the hint goes away (read through the AX tree)
- [ ] Settings with no Arabic keyboard added: "To switch to Arabic, add an Arabic keyboard in System Settings →
      Keyboard → Text Input"; adding one and returning to Settings clears it
- [ ] The same two hints in Arabic, on Windows and on Linux X11

## Browser extension → desktop app (native messaging)

- [x] ✅ macOS: the host answers framed messages like Chrome sends them (ping; ABC → Arabic → "already-active" → ABC;
      an unknown request is refused)
- [x] ✅ Automated: `apps/extension/e2e/desktop.spec.ts` (fake host in the Playwright profile)
- [x] ✅ After opening the app once, `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/io.github.bugsbountyhunter.layoutfixer.json`
      exists and points at `/Applications/Layout Fixer.app/Contents/MacOS/layout-fixer-desktop`, allowing only the store id
      (verified with the installed, release-signed 1.3.2)
- [x] ✅ The installed release app answers as the host (1.3.2: ping; ABC → Arabic → "already-active" → ABC; unknown
      request refused)
- [ ] Store extension in Chrome: Settings → Keyboard layout → switch on → permission prompt → "Connected to Layout
      Fixer for desktop 1.3.0"; fixing `hgsghl` in a text field switches the menu-bar input source to Arabic
- [ ] Desktop app not installed: the switch shows the "isn't installed" notice with the download link
- [ ] Windows: registry keys under `HKCU\Software\Google\Chrome\NativeMessagingHosts` and Edge; the switch works in
      Chrome and Edge (no console window flashes)
- [ ] Linux X11: manifest in `~/.config/google-chrome/NativeMessagingHosts`; the AppImage path is the `.AppImage` file
- [ ] Firefox (desktop): manifest in the Mozilla folder; the switch works with the Firefox build

## Windows

Automated on the Windows CI runner: the real clipboard round trip (write, read, restore a standard and a registered
format) and the Ctrl chord order. Check by hand on Windows 10 and 11:

- [ ] Tray icon and menu, Settings opens and hides, single instance
- [ ] Notepad: `hgsghl ugd;l` → `السلام عليكم` with Alt+Shift+F, with the Arabic (101) layout active and with English active
- [ ] Ctrl+Z restores the original in one step
- [ ] Holding Alt+Shift a moment longer doesn't open a menu (Alt) or Start (Win) and the paste still lands
- [ ] Clipboard restored after a fix: text, an image (Paint), files (Explorer)
- [ ] Win+V history does not show the fixed text
- [ ] Notepad or Terminal *run as administrator*: message "Can't fix text in apps running as administrator"
- [ ] Word, Outlook, Teams/Slack, Chrome/Edge text fields
- [ ] SmartScreen "More info → Run anyway" on the unsigned installer (NSIS and MSI)
- [ ] Layout switching (English (US) + Arabic (101) installed): fixing `hgsghl` in Notepad switches the taskbar
      indicator to AR, fixing `اثممخ` switches back to EN; the next keystrokes use the new layout
- [ ] Layout switching in Chrome/Edge, Word and Windows Terminal (consoles handle the request differently)
- [ ] Layout switching with only English installed: the fix works, nothing else happens

## Linux

Automated on the Ubuntu CI runner under Xvfb: the real X11 clipboard round trip (marker, transient write, restore of
text + HTML), the XTest chord order and the Wayland detection. Check by hand on an X11 session (Ubuntu "Ubuntu on
Xorg", Fedora "GNOME on Xorg", KDE Plasma X11, Linux Mint Cinnamon):

- [ ] Tray icon and menu (needs an AppIndicator/StatusNotifier host, e.g. the GNOME AppIndicator extension)
- [ ] gedit / Kate / Mousepad: `hgsghl ugd;l` → `السلام عليكم` with Alt+Shift+F, with Arabic and with English active
- [ ] Ctrl+Z restores the original
- [ ] Holding Alt+Shift longer doesn't trigger a menu, and the paste still lands
- [ ] Clipboard restored after a fix: plain text, rich text from LibreOffice (HTML), an image
- [ ] KDE Klipper / GNOME clipboard extensions don't record the fixed text
- [ ] Firefox and Chrome text fields, LibreOffice Writer, Telegram
- [ ] AppImage and .deb both install and start
- [ ] Layout switching with `setxkbmap us,ara` (or KDE/Xfce/Cinnamon with both layouts): fixing switches the group
      and the panel indicator follows
- [ ] GNOME (Ubuntu 24.04+, Fedora 40+), Wayland and Xorg: Settings → Keyboard switching on GNOME → Install → "Log
      out to finish"; after logging back in it shows "On", and fixing text switches the top-bar indicator (the shortcut
      on Xorg, the browser extension on Wayland)
- [ ] GNOME with extensions turned off in the Extensions app: "Extensions are off"
- [ ] KDE Plasma Wayland: the browser extension's fix switches the layout (KWin's `org.kde.keyboard`)
- [ ] **Wayland session:** Settings shows the Wayland notice; Fix Selection in the tray shows
      "Fixing text needs an X11 session on Linux for now"

Known limits: copied files (`text/uri-list`) and app-private formats are not restored on Linux; fixing text on
Wayland (portal / `ydotool`) is later work — only layout switching works there (KDE Plasma, GNOME).
