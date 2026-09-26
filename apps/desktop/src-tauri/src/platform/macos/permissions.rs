use core_foundation::base::TCFType;
use core_foundation::boolean::CFBoolean;
use core_foundation::dictionary::{CFDictionary, CFDictionaryRef};
use core_foundation::string::{CFString, CFStringRef};

#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn AXIsProcessTrusted() -> bool;
    fn AXIsProcessTrustedWithOptions(options: CFDictionaryRef) -> bool;
    static kAXTrustedCheckOptionPrompt: CFStringRef;
}

#[link(name = "Carbon", kind = "framework")]
extern "C" {
    fn IsSecureEventInputEnabled() -> bool;
}

const ACCESSIBILITY_SETTINGS: &str =
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

/// Whether the app may send ⌘C / ⌘V to other apps.
pub fn accessibility_trusted() -> bool {
    // SAFETY: no arguments; reads the TCC state for this process.
    unsafe { AXIsProcessTrusted() }
}

/// Shows the system prompt (which also adds the app to the Accessibility list, switched off),
/// then opens that list in System Settings.
pub fn request_accessibility() {
    // SAFETY: kAXTrustedCheckOptionPrompt is an immutable framework constant.
    let key = unsafe { CFString::wrap_under_get_rule(kAXTrustedCheckOptionPrompt) };
    let options = CFDictionary::from_CFType_pairs(&[(key, CFBoolean::true_value())]);
    // SAFETY: `options` lives until the call returns.
    let trusted = unsafe { AXIsProcessTrustedWithOptions(options.as_concrete_TypeRef()) };
    if !trusted {
        if let Err(error) = std::process::Command::new("open")
            .arg(ACCESSIBILITY_SETTINGS)
            .status()
        {
            eprintln!("[layout-fixer] could not open Accessibility settings: {error}");
        }
    }
}

/// On while a password field has focus; macOS then drops synthetic key events.
pub fn secure_input_enabled() -> bool {
    // SAFETY: no arguments; reads global input state.
    unsafe { IsSecureEventInputEnabled() }
}
