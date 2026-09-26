use serde::Serialize;

use super::FixError;

/// A keyboard layout the user has enabled in the OS.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InputLayout {
    /// The OS identifier: `com.apple.keylayout.ArabicPC` on macOS.
    pub id: String,
    /// BCP 47 codes, primary language first (`ar`, `en`, `en-GB`).
    pub languages: Vec<String>,
}

/// The OS list of keyboard layouts. Implementations never add, remove or reorder layouts.
pub trait InputSources {
    /// Enabled layouts, in the user's order.
    fn enabled(&self) -> Result<Vec<InputLayout>, FixError>;
    fn current(&self) -> Option<InputLayout>;
    fn select(&self, id: &str) -> Result<(), FixError>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum LayoutSwitch {
    Switched,
    /// A layout for that language is already active; the user's choice (ABC vs U.S.) is kept.
    AlreadyActive,
    /// No enabled layout types that language.
    NotInstalled,
}

impl InputLayout {
    /// The primary language without its region: `en` for `en-GB`.
    pub fn language(&self) -> Option<&str> {
        let code = self.languages.first()?;
        code.split(['-', '_']).next()
    }
}

fn types_language(layout: &InputLayout, language: &str) -> bool {
    layout
        .language()
        .is_some_and(|code| code.eq_ignore_ascii_case(language))
}

/// A preferred layout wins (the Arabic layout the user picked in Settings), then the first enabled
/// layout for the language.
pub fn choose<'a>(
    layouts: &'a [InputLayout],
    language: &str,
    preferred: &[&str],
) -> Option<&'a InputLayout> {
    preferred
        .iter()
        .find_map(|id| layouts.iter().find(|layout| layout.id == *id))
        .filter(|layout| types_language(layout, language))
        .or_else(|| {
            layouts
                .iter()
                .find(|layout| types_language(layout, language))
        })
}

/// Switches the OS to a layout that types `language`, if one is enabled and none is active.
pub fn switch_to(
    sources: &dyn InputSources,
    language: &str,
    preferred: &[&str],
) -> Result<LayoutSwitch, FixError> {
    if sources
        .current()
        .is_some_and(|current| types_language(&current, language))
    {
        return Ok(LayoutSwitch::AlreadyActive);
    }
    let layouts = sources.enabled()?;
    match choose(&layouts, language, preferred) {
        Some(layout) => sources.select(&layout.id).map(|()| LayoutSwitch::Switched),
        None => Ok(LayoutSwitch::NotInstalled),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    fn layout(id: &str, languages: &[&str]) -> InputLayout {
        InputLayout {
            id: id.into(),
            languages: languages.iter().map(|code| (*code).into()).collect(),
        }
    }

    fn mac_layouts() -> Vec<InputLayout> {
        vec![
            layout("com.apple.keylayout.ABC", &["en", "ar", "fr"]),
            layout("com.apple.keylayout.Arabic", &["ar"]),
            layout("com.apple.keylayout.ArabicPC", &["ar"]),
        ]
    }

    #[test]
    fn prefers_the_arabic_layout_chosen_in_settings() {
        let layouts = mac_layouts();
        let chosen = choose(&layouts, "ar", &["com.apple.keylayout.ArabicPC"]).unwrap();
        assert_eq!(chosen.id, "com.apple.keylayout.ArabicPC");
    }

    #[test]
    fn falls_back_to_the_first_layout_for_the_language() {
        let layouts = vec![layout("com.apple.keylayout.Arabic", &["ar"])];
        let chosen = choose(&layouts, "ar", &["com.apple.keylayout.ArabicPC"]).unwrap();
        assert_eq!(chosen.id, "com.apple.keylayout.Arabic");
    }

    #[test]
    fn matches_only_the_primary_language() {
        // ABC also lists Arabic among the languages it can type; it is still an English layout.
        let layouts = vec![layout("com.apple.keylayout.ABC", &["en", "ar"])];
        assert!(choose(&layouts, "ar", &[]).is_none());
        assert_eq!(
            choose(&layouts, "en", &[]).unwrap().id,
            "com.apple.keylayout.ABC"
        );
    }

    #[test]
    fn regional_variants_count_as_the_language() {
        let layouts = vec![layout("com.apple.keylayout.British", &["en-GB"])];
        assert_eq!(
            choose(&layouts, "en", &[]).unwrap().id,
            "com.apple.keylayout.British"
        );
    }

    #[test]
    fn a_preferred_layout_for_another_language_is_ignored() {
        let layouts = mac_layouts();
        let chosen = choose(&layouts, "en", &["com.apple.keylayout.ArabicPC"]).unwrap();
        assert_eq!(chosen.id, "com.apple.keylayout.ABC");
    }

    #[test]
    fn keeps_the_users_order() {
        let layouts = vec![
            layout("com.apple.keylayout.US", &["en"]),
            layout("com.apple.keylayout.ABC", &["en"]),
        ];
        assert_eq!(
            choose(&layouts, "en", &[]).unwrap().id,
            "com.apple.keylayout.US"
        );
    }

    struct FakeSources {
        layouts: Vec<InputLayout>,
        current: Mutex<Option<InputLayout>>,
        selected: Mutex<Vec<String>>,
        select_error: Option<FixError>,
    }

    impl FakeSources {
        fn new(current: &str) -> Self {
            let layouts = mac_layouts();
            let current = layouts.iter().find(|layout| layout.id == current).cloned();
            Self {
                layouts,
                current: Mutex::new(current),
                selected: Mutex::default(),
                select_error: None,
            }
        }
        fn selected(&self) -> Vec<String> {
            self.selected.lock().unwrap().clone()
        }
    }

    impl InputSources for FakeSources {
        fn enabled(&self) -> Result<Vec<InputLayout>, FixError> {
            Ok(self.layouts.clone())
        }
        fn current(&self) -> Option<InputLayout> {
            self.current.lock().unwrap().clone()
        }
        fn select(&self, id: &str) -> Result<(), FixError> {
            if let Some(error) = &self.select_error {
                return Err(error.clone());
            }
            self.selected.lock().unwrap().push(id.into());
            Ok(())
        }
    }

    #[test]
    fn switches_to_the_target_language() {
        let sources = FakeSources::new("com.apple.keylayout.ABC");
        assert_eq!(
            switch_to(&sources, "ar", &["com.apple.keylayout.Arabic"]),
            Ok(LayoutSwitch::Switched)
        );
        assert_eq!(sources.selected(), vec!["com.apple.keylayout.Arabic"]);
    }

    #[test]
    fn leaves_an_active_layout_for_the_language_alone() {
        // The user is on Arabic (Mac) and Settings says PC: their active choice stays.
        let sources = FakeSources::new("com.apple.keylayout.Arabic");
        assert_eq!(
            switch_to(&sources, "ar", &["com.apple.keylayout.ArabicPC"]),
            Ok(LayoutSwitch::AlreadyActive)
        );
        assert!(sources.selected().is_empty());
    }

    #[test]
    fn does_nothing_when_no_layout_types_the_language() {
        let sources = FakeSources::new("com.apple.keylayout.ABC");
        assert_eq!(
            switch_to(&sources, "ru", &[]),
            Ok(LayoutSwitch::NotInstalled)
        );
        assert!(sources.selected().is_empty());
    }

    #[test]
    fn reports_a_failed_switch() {
        let sources = FakeSources {
            select_error: Some(FixError::System("TISSelectInputSource -50".into())),
            ..FakeSources::new("com.apple.keylayout.ABC")
        };
        assert_eq!(
            switch_to(&sources, "ar", &[]),
            Err(FixError::System("TISSelectInputSource -50".into()))
        );
    }
}
