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

/// An XDG base directory: the variable when it holds an absolute path (the spec says to ignore an
/// empty or relative one), else `$HOME/<fallback>`.
pub fn xdg_dir(variable: &str, fallback: &str) -> Option<std::path::PathBuf> {
    xdg_dir_from(
        std::env::var_os(variable).map(std::path::PathBuf::from),
        std::env::var_os("HOME").map(std::path::PathBuf::from),
        fallback,
    )
}

fn xdg_dir_from(
    value: Option<std::path::PathBuf>,
    home: Option<std::path::PathBuf>,
    fallback: &str,
) -> Option<std::path::PathBuf> {
    value
        .filter(|path| path.is_absolute())
        .or_else(|| home.map(|home| home.join(fallback)))
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
    fn ignores_an_empty_or_relative_xdg_variable() {
        let home = Some("/home/me".into());
        let dir =
            |value: Option<&str>| xdg_dir_from(value.map(Into::into), home.clone(), ".local/share");
        assert_eq!(dir(Some("/data")), Some("/data".into()));
        assert_eq!(dir(Some("")), Some("/home/me/.local/share".into()));
        assert_eq!(dir(Some("data")), Some("/home/me/.local/share".into()));
        assert_eq!(dir(None), Some("/home/me/.local/share".into()));
    }

    #[test]
    fn follows_the_session_type_first() {
        assert!(is_wayland_session(Some("wayland"), false));
        assert!(!is_wayland_session(Some("x11"), true));
        assert!(is_wayland_session(None, true));
        assert!(!is_wayland_session(None, false));
    }
}
