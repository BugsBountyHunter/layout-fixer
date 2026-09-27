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
    names_include(current_desktop, &["gnome"])
}

/// Cinnamon sets `XDG_CURRENT_DESKTOP=X-Cinnamon`.
pub fn is_cinnamon() -> bool {
    is_cinnamon_desktop(std::env::var("XDG_CURRENT_DESKTOP").ok().as_deref())
}

fn is_cinnamon_desktop(current_desktop: Option<&str>) -> bool {
    names_include(current_desktop, &["x-cinnamon", "cinnamon"])
}

/// Plasma sets `XDG_CURRENT_DESKTOP=KDE`.
pub fn is_kde() -> bool {
    names_include(
        std::env::var("XDG_CURRENT_DESKTOP").ok().as_deref(),
        &["kde"],
    )
}

fn names_include(current_desktop: Option<&str>, wanted: &[&str]) -> bool {
    current_desktop
        .unwrap_or_default()
        .split(':')
        .any(|name| wanted.iter().any(|want| name.eq_ignore_ascii_case(want)))
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
    fn recognizes_cinnamon() {
        assert!(is_cinnamon_desktop(Some("X-Cinnamon")));
        assert!(!is_cinnamon_desktop(Some("GNOME")));
        assert!(!is_cinnamon_desktop(None));
    }

    #[test]
    fn recognizes_kde() {
        assert!(names_include(Some("KDE"), &["kde"]));
        assert!(!names_include(Some("X-Cinnamon"), &["kde"]));
    }

    #[test]
    fn follows_the_session_type_first() {
        assert!(is_wayland_session(Some("wayland"), false));
        assert!(!is_wayland_session(Some("x11"), true));
        assert!(is_wayland_session(None, true));
        assert!(!is_wayland_session(None, false));
    }
}
