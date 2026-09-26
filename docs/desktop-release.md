# Releasing the desktop app

## One-time setup

Run `bash apps/desktop/scripts/create-release-keys.sh` from the repository root on your own Mac. It creates the
updater key and the self-signed "Layout Fixer" code-signing certificate in `~/.tauri/layout-fixer/`, uploads
them as the GitHub Actions secrets `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`,
`MACOS_CERTIFICATE` and `MACOS_CERTIFICATE_PASSWORD`, and writes the public updater key to
`apps/desktop/src-tauri/updater.pub`. Back the folder and both passwords up: without them, existing installs
can't update and macOS users must allow Accessibility again.

## Each release

1. In a pull request, bump the version in `apps/desktop/package.json`, `apps/desktop/src-tauri/tauri.conf.json`
   and `apps/desktop/src-tauri/Cargo.toml` (+ `Cargo.lock`), and add a `## [x.y.z]` section to
   `apps/desktop/CHANGELOG.md`.
2. After it merges, tag `main`: `git tag desktop-vX.Y.Z && git push origin desktop-vX.Y.Z`.
3. `.github/workflows/release-desktop.yml` checks the versions, builds and signs on macOS (universal),
   Windows and Ubuntu 22.04, publishes the `desktop-vX.Y.Z` release with the changelog and
   [first-launch steps](desktop-first-launch.md), then copies the installers under stable names and the
   updater's `latest.json` into the rolling `desktop-latest` release.
4. Installed apps find the update through
   `https://github.com/BugsBountyHunter/layout-fixer/releases/download/desktop-latest/latest.json`.
   The landing page links to the stable names in `desktop-latest`.

Extension releases use `vX.Y.Z` tags and `.github/workflows/release.yml`; the two never overlap.
