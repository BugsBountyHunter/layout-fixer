//! Text Input Sources (HIToolbox). No permission is needed to list or select a keyboard layout.
//! Recent macOS versions assert that these calls run on the main thread.

use std::ffi::c_void;

use core_foundation::array::{CFArray, CFArrayRef};
use core_foundation::base::{CFType, CFTypeRef, TCFType};
use core_foundation::boolean::CFBoolean;
use core_foundation::dictionary::{CFDictionary, CFDictionaryRef};
use core_foundation::string::{CFString, CFStringRef};

use crate::fix::{FixError, InputLayout, InputSources};
use crate::platform::ArabicLayout;

type TISInputSourceRef = CFTypeRef;

#[link(name = "Carbon", kind = "framework")]
extern "C" {
    fn TISCreateInputSourceList(
        properties: CFDictionaryRef,
        include_all_installed: u8,
    ) -> CFArrayRef;
    fn TISCopyCurrentKeyboardInputSource() -> TISInputSourceRef;
    fn TISGetInputSourceProperty(source: TISInputSourceRef, key: CFStringRef) -> *const c_void;
    fn TISSelectInputSource(source: TISInputSourceRef) -> i32;
    static kTISPropertyInputSourceID: CFStringRef;
    static kTISPropertyInputSourceLanguages: CFStringRef;
    static kTISPropertyInputSourceCategory: CFStringRef;
    static kTISPropertyInputSourceIsSelectCapable: CFStringRef;
    static kTISCategoryKeyboardInputSource: CFStringRef;
}

pub struct MacInputSources;

/// The macOS layouts that match the Arabic layout chosen in Settings.
pub fn preferred_ids(layout: ArabicLayout) -> &'static [&'static str] {
    match layout {
        ArabicLayout::ArPc => &["com.apple.keylayout.ArabicPC"],
        ArabicLayout::ArMac => &["com.apple.keylayout.Arabic"],
    }
}

/// SAFETY for all helpers: the keys are immutable framework constants, and `source` is a live
/// TISInputSource owned by a CFType or CFArray that outlives the call.
fn key(constant: CFStringRef) -> CFString {
    unsafe { CFString::wrap_under_get_rule(constant) }
}

fn string_property(source: TISInputSourceRef, name: CFStringRef) -> Option<String> {
    let value = unsafe { TISGetInputSourceProperty(source, name) };
    (!value.is_null())
        .then(|| unsafe { CFString::wrap_under_get_rule(value as CFStringRef) }.to_string())
}

fn languages(source: TISInputSourceRef) -> Vec<String> {
    let value = unsafe { TISGetInputSourceProperty(source, kTISPropertyInputSourceLanguages) };
    if value.is_null() {
        return Vec::new();
    }
    let array = unsafe { CFArray::<CFString>::wrap_under_get_rule(value as CFArrayRef) };
    array.iter().map(|code| code.to_string()).collect()
}

fn layout_of(source: TISInputSourceRef) -> Option<InputLayout> {
    Some(InputLayout {
        id: string_property(source, unsafe { kTISPropertyInputSourceID })?,
        languages: languages(source),
    })
}

/// Enabled, selectable keyboard input sources matching `extra`, in the user's order.
fn list(extra: Option<(CFString, CFType)>) -> Result<CFArray<CFType>, FixError> {
    let mut pairs = vec![
        (
            key(unsafe { kTISPropertyInputSourceCategory }),
            key(unsafe { kTISCategoryKeyboardInputSource }).as_CFType(),
        ),
        (
            key(unsafe { kTISPropertyInputSourceIsSelectCapable }),
            CFBoolean::true_value().as_CFType(),
        ),
    ];
    pairs.extend(extra);
    let filter = CFDictionary::from_CFType_pairs(&pairs);
    // SAFETY: `filter` lives until the call returns; the result follows the create rule.
    let array = unsafe { TISCreateInputSourceList(filter.as_concrete_TypeRef(), 0) };
    if array.is_null() {
        return Err(FixError::System(
            "TISCreateInputSourceList returned nothing".into(),
        ));
    }
    Ok(unsafe { CFArray::wrap_under_create_rule(array) })
}

impl InputSources for MacInputSources {
    fn enabled(&self) -> Result<Vec<InputLayout>, FixError> {
        Ok(list(None)?
            .iter()
            .filter_map(|source| layout_of(source.as_CFTypeRef()))
            .collect())
    }

    fn current(&self) -> Option<InputLayout> {
        let source = unsafe { TISCopyCurrentKeyboardInputSource() };
        if source.is_null() {
            return None;
        }
        // SAFETY: a Copy function, so we own the reference; CFType releases it.
        let source = unsafe { CFType::wrap_under_create_rule(source) };
        layout_of(source.as_CFTypeRef())
    }

    fn select(&self, id: &str) -> Result<(), FixError> {
        let by_id = (
            key(unsafe { kTISPropertyInputSourceID }),
            CFString::new(id).as_CFType(),
        );
        let matches = list(Some(by_id))?;
        let source = matches
            .iter()
            .next()
            .ok_or_else(|| FixError::System(format!("no input source {id}")))?;
        // SAFETY: `source` is kept alive by `matches`.
        match unsafe { TISSelectInputSource(source.as_CFTypeRef()) } {
            0 => Ok(()),
            status => Err(FixError::System(format!("TISSelectInputSource {status}"))),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fix::{switch_to, LayoutSwitch};

    /// Changes the real input source, so it only runs on request:
    /// `cargo test -- --ignored --test-threads=1 switches_the_real_layout`.
    #[test]
    #[ignore = "changes the Mac's keyboard layout"]
    fn switches_the_real_layout_and_back() {
        let sources = MacInputSources;
        let original = sources.current().expect("a current layout");
        let enabled = sources.enabled().unwrap();
        println!("enabled: {enabled:?}\ncurrent: {}", original.id);
        let other = if original.languages.first().is_some_and(|code| code == "ar") {
            "en"
        } else {
            "ar"
        };

        assert_eq!(switch_to(&sources, other, &[]), Ok(LayoutSwitch::Switched));
        let switched = sources.current().unwrap();
        assert!(switched.languages[0].starts_with(other), "{switched:?}");
        assert_eq!(
            switch_to(&sources, other, &[]),
            Ok(LayoutSwitch::AlreadyActive)
        );

        sources.select(&original.id).unwrap();
        assert_eq!(sources.current().unwrap().id, original.id);
    }
}
