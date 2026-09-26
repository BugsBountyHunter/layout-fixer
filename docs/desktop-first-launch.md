
---

### Downloads

| System | File |
|---|---|
| macOS 12+ (Apple silicon and Intel) | `Layout.Fixer_…_universal.dmg` |
| Windows 10 / 11 | `Layout.Fixer_…_x64-setup.exe` (or the `.msi`) |
| Linux (X11) | `Layout.Fixer_…_amd64.AppImage` or `.deb` |

The same files under stable names are always in the [desktop-latest](https://github.com/BugsBountyHunter/layout-fixer/releases/tag/desktop-latest) release.

### First launch

Layout Fixer is free and open source, and not signed with a paid Apple or Microsoft certificate yet, so the
system asks you to confirm the first launch once:

- **macOS:** open the app; when macOS says it can't verify it, open **System Settings → Privacy & Security**,
  scroll down and click **Open Anyway**. Then allow Layout Fixer under **Accessibility** when asked, so it can
  press ⌘C and ⌘V for you.
- **Windows:** when SmartScreen says "Windows protected your PC", click **More info → Run anyway**.
- **Linux:** make the AppImage executable (`chmod +x`) and open it, or install the `.deb`. Use an X11 session.

Updates install themselves after that, verified with the project's signing key.
