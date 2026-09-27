//! Native messaging: the browser extension launches this app as a short-lived helper to switch the
//! keyboard layout after it fixes text. Browsers start the host with the caller as an argument:
//! `chrome-extension://<id>/` from Chromium, the manifest path and the add-on id from Firefox.

mod protocol;
pub mod register;
#[cfg(windows)]
mod windows_registry;

use crate::platform::{preferred_ids, SystemInputSources};

const FIREFOX_ORIGIN: &str = "layout-fixer@layoutfixer.dev";

/// Whether this process was started by a browser as the native host.
pub fn is_host_launch(args: &[String]) -> bool {
    args.iter()
        .skip(1)
        .any(|arg| arg.starts_with("chrome-extension://") || arg == FIREFOX_ORIGIN)
}

/// Answers the browser's request(s) on stdin/stdout, then returns so the process exits. Runs on
/// the main thread, which macOS requires for input-source changes.
pub fn run() {
    let mut input = std::io::stdin().lock();
    let mut output = std::io::stdout().lock();
    loop {
        match protocol::read_message(&mut input) {
            Ok(Some(body)) => {
                let response = protocol::handle(&body, &SystemInputSources, preferred_ids);
                if let Err(error) = protocol::write_message(&mut output, &response) {
                    eprintln!("[layout-fixer] native host: {error}");
                    return;
                }
            }
            Ok(None) => return,
            Err(error) => {
                eprintln!("[layout-fixer] native host: {error}");
                return;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(list: &[&str]) -> Vec<String> {
        list.iter().map(|arg| (*arg).to_owned()).collect()
    }

    #[test]
    fn recognizes_browser_launches() {
        assert!(is_host_launch(&args(&[
            "layout-fixer-desktop",
            "chrome-extension://cikmlhdhgneblnmkkmiolciffcgbgljj/"
        ])));
        // Windows Chrome adds --parent-window after the origin.
        assert!(is_host_launch(&args(&[
            "layout-fixer-desktop.exe",
            "chrome-extension://cikmlhdhgneblnmkkmiolciffcgbgljj/",
            "--parent-window=0"
        ])));
        assert!(is_host_launch(&args(&[
            "layout-fixer-desktop",
            "/home/me/.mozilla/native-messaging-hosts/io.github.bugsbountyhunter.layoutfixer.json",
            "layout-fixer@layoutfixer.dev"
        ])));
    }

    #[test]
    fn a_normal_launch_starts_the_app() {
        assert!(!is_host_launch(&args(&["layout-fixer-desktop"])));
        assert!(!is_host_launch(&args(&[
            "layout-fixer-desktop",
            "--minimized"
        ])));
    }
}
