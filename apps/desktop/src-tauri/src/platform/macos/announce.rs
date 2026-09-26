use objc2::runtime::AnyObject;
use objc2::MainThreadMarker;
use objc2_app_kit::{
    NSAccessibilityAnnouncementKey, NSAccessibilityAnnouncementRequestedNotification,
    NSAccessibilityPostNotificationWithUserInfo, NSAccessibilityPriorityKey,
    NSAccessibilityPriorityLevel, NSApplication,
};
use objc2_foundation::{NSDictionary, NSNumber, NSString};

/// Asks VoiceOver to speak `message` now. The message pill never takes focus, so VoiceOver would
/// otherwise never notice it. Does nothing when VoiceOver is off. Must run on the main thread.
pub fn announce(message: &str) {
    let Some(main_thread) = MainThreadMarker::new() else {
        eprintln!("[layout-fixer] announcements must be posted on the main thread");
        return;
    };
    let app = NSApplication::sharedApplication(main_thread);
    let text = NSString::from_str(message);
    // High priority interrupts what VoiceOver is saying, like the system's own alerts.
    let priority = NSNumber::new_isize(NSAccessibilityPriorityLevel::High.0);
    // SAFETY: the keys are immutable AppKit constants; the dictionary holds the documented value types
    // (NSString for the announcement, NSNumber for the priority) and outlives the call.
    unsafe {
        let info = NSDictionary::<_, AnyObject>::from_slices(
            &[NSAccessibilityAnnouncementKey, NSAccessibilityPriorityKey],
            &[text.as_ref(), priority.as_ref()],
        );
        NSAccessibilityPostNotificationWithUserInfo(
            &app,
            NSAccessibilityAnnouncementRequestedNotification,
            Some(&info),
        );
    }
}
