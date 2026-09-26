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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn follows_the_session_type_first() {
        assert!(is_wayland_session(Some("wayland"), false));
        assert!(!is_wayland_session(Some("x11"), true));
        assert!(is_wayland_session(None, true));
        assert!(!is_wayland_session(None, false));
    }
}
