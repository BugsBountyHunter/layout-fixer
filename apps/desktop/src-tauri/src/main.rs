// Release builds on Windows must not open a console window next to the tray icon.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if layout_fixer_desktop_lib::run_native_host_if_requested() {
        return;
    }
    layout_fixer_desktop_lib::run()
}
