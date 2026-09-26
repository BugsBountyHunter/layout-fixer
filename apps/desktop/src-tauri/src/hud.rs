use std::sync::atomic::{AtomicU64, Ordering};
use std::{thread, time::Duration};

use tauri::{
    AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, WebviewUrl, WebviewWindowBuilder,
};

pub const LABEL: &str = "hud";
const MESSAGE_EVENT: &str = "hud-message";
const VISIBLE_FOR: Duration = Duration::from_millis(1600);
// Larger than the pill so its shadow isn't clipped by the window edge.
const WIDTH: f64 = 420.0;
const HEIGHT: f64 = 96.0;
/// Distance from the bottom of the screen, like the macOS volume/brightness HUD.
const BOTTOM_OFFSET: f64 = 140.0;

/// Which message is on screen, so an older timer doesn't hide a newer message.
#[derive(Default)]
pub struct Generation(AtomicU64);

/// A small pill that never takes focus, so the user's app keeps its selection and cursor.
pub fn create(app: &AppHandle) -> tauri::Result<()> {
    let window = WebviewWindowBuilder::new(app, LABEL, WebviewUrl::App("hud.html".into()))
        .title("Layout Fixer")
        .inner_size(WIDTH, HEIGHT)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .always_on_top(true)
        .visible_on_all_workspaces(true)
        .skip_taskbar(true)
        .resizable(false)
        .focused(false)
        .focusable(false)
        .visible(false)
        .build()?;
    window.set_ignore_cursor_events(true)
}

/// Top-left of the pill window: centered, `BOTTOM_OFFSET` above the bottom of the given screen.
/// Works in logical points; physical pixels break on setups mixing 2× and 1× displays.
fn hud_origin(screen: LogicalPosition<f64>, screen_size: LogicalSize<f64>) -> LogicalPosition<f64> {
    LogicalPosition::new(
        screen.x + (screen_size.width - WIDTH) / 2.0,
        screen.y + screen_size.height - BOTTOM_OFFSET - HEIGHT,
    )
}

fn place_on_active_screen(app: &AppHandle, window: &tauri::WebviewWindow) -> tauri::Result<()> {
    let cursor = app.cursor_position()?;
    let Some(monitor) = app.monitor_from_point(cursor.x, cursor.y)? else {
        return Ok(());
    };
    let scale = monitor.scale_factor();
    let origin = hud_origin(
        monitor.position().to_logical(scale),
        monitor.size().to_logical(scale),
    );
    window.set_position(origin)
}

pub fn show(app: &AppHandle, message: &str) {
    let Some(window) = app.get_webview_window(LABEL) else {
        return;
    };
    if let Err(error) = place_on_active_screen(app, &window) {
        eprintln!("[layout-fixer] could not place the message: {error}");
    }
    let _ = app.emit_to(LABEL, MESSAGE_EVENT, message);
    if let Err(error) = window.show() {
        eprintln!("[layout-fixer] could not show the message: {error}");
        return;
    }

    let generation = app.state::<Generation>().0.fetch_add(1, Ordering::SeqCst) + 1;
    let app = app.clone();
    thread::spawn(move || {
        thread::sleep(VISIBLE_FOR);
        if app.state::<Generation>().0.load(Ordering::SeqCst) == generation {
            let _ = window.hide();
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn centers_near_the_bottom_of_the_screen() {
        let origin = hud_origin(
            LogicalPosition::new(0.0, 0.0),
            LogicalSize::new(1512.0, 982.0),
        );
        assert_eq!((origin.x, origin.y), (546.0, 746.0));
    }

    #[test]
    fn uses_the_screen_the_cursor_is_on() {
        let origin = hud_origin(
            LogicalPosition::new(-2560.0, -270.0),
            LogicalSize::new(2560.0, 1440.0),
        );
        assert_eq!((origin.x, origin.y), (-1490.0, 934.0));
    }
}
