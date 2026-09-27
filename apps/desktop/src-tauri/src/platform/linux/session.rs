/// Wayland doesn't let apps send keys to other apps or grab global shortcuts; XWayland only reaches
/// X11 windows. The fix needs an X11 session until portal support lands (v1.1).
pub fn is_wayland() -> bool {
    is_wayland_session(
        std::env::var("XDG_SESSION_TYPE").ok().as_deref(),
        std::env::var_os("WAYLAND_DISPLAY").is_some(),
    )
}

fn is_wayland_session(session_type: Option<&str>, wayland_display: bool) -> bool {
    match session_type {
        Some(kind) => kind.eq_ignore_ascii_case("wayland"),
        None => wayland_display,
    }
}

/// GNOME keeps its own input-source list and loads one layout into XKB at a time, so the XKB
/// groups don't show the user's layouts. `XDG_CURRENT_DESKTOP` is colon-separated (`ubuntu:GNOME`).
pub fn is_gnome() -> bool {
    is_gnome_desktop(std::env::var("XDG_CURRENT_DESKTOP").ok().as_deref())
}

fn is_gnome_desktop(current_desktop: Option<&str>) -> bool {
    current_desktop
        .unwrap_or_default()
        .split(':')
        .any(|name| name.eq_ignore_ascii_case("gnome"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recognizes_gnome_among_the_desktop_names() {
        assert!(is_gnome_desktop(Some("GNOME")));
        assert!(is_gnome_desktop(Some("ubuntu:GNOME")));
        assert!(is_gnome_desktop(Some("pop:GNOME")));
        assert!(!is_gnome_desktop(Some("X-Cinnamon")));
        assert!(!is_gnome_desktop(Some("KDE")));
        assert!(is_gnome_desktop(Some("GNOME-Flashback:GNOME")));
        assert!(!is_gnome_desktop(None));
    }

    #[test]
    fn follows_the_session_type_first() {
        assert!(is_wayland_session(Some("wayland"), false));
        assert!(!is_wayland_session(Some("x11"), true));
        assert!(is_wayland_session(None, true));
        assert!(!is_wayland_session(None, false));
    }
}
