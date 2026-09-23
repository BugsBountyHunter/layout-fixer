# Store listing — Layout Fixer 1.0

**v1.0 ships on the Chrome Web Store only.** Edge Add-ons (same Chrome package) and
addons.mozilla.org come later; the Firefox build stays in the repository and CI meanwhile.

## Name
- **English:** Layout Fixer — Arabic ⇄ English keyboard fix
- **Arabic:** مصحح لغة الكيبورد — عربي ⇄ إنجليزي

## Short description (≤ 132 characters)
- **EN:** Typed with the wrong keyboard layout? Select the text and press ⌥⇧F / Alt+Shift+F to fix Arabic ⇄ English instantly.
- **AR:** كتبت واللغة خطأ؟ حدد النص واضغط Alt+Shift+F ليتحول فورًا بين العربي والإنجليزي.

## Full description — English
Forgot to switch your keyboard and typed `hgsghl ugd;l` instead of `السلام عليكم`?
Layout Fixer fixes it in one keystroke — no deleting, no retyping.

**How it works**
• Select the text and press Alt+Shift+F (⌥⇧F on Mac) — or right-click → Fix keyboard layout
• Nothing selected in a text box? The whole field is fixed
• Works both ways: Arabic typed on the English layout, and English typed on the Arabic layout
• Undo with Ctrl+Z / ⌘Z
• Works in Gmail, WhatsApp Web, Slack, search boxes and most websites
• Text you can't edit (like a message you received)? The fixed text is copied and shown
• Paste-and-fix box in the toolbar popup
• Optional selection button: select text, click the icon, pick the language — with a live preview

**Your keyboard, your way**
• Supports the PC Arabic layout (Windows, Linux, ChromeOS, macOS "Arabic – PC") and the macOS
  "Arabic" layout — chosen automatically, changeable in Settings
• Interface in English and Arabic, light and dark mode

**Private by design**
Everything happens on your device. No data collection, no tracking, no network requests.

## Full description — Arabic
نسيت تغيير لغة الكيبورد وكتبت `hgsghl ugd;l` بدل `السلام عليكم`؟
مصحح لغة الكيبورد يصلحها بضغطة واحدة — بدون حذف أو إعادة كتابة.

**طريقة العمل**
• حدد النص واضغط Alt+Shift+F (⌥⇧F على Mac) — أو انقر بالزر الأيمن ← تصحيح لغة الكيبورد
• لم تحدد شيئًا داخل حقل نص؟ يُصحَّح الحقل كاملًا
• يعمل في الاتجاهين: عربي مكتوب بالكيبورد الإنجليزي، وإنجليزي مكتوب بالكيبورد العربي
• تراجع بـ Ctrl+Z / ⌘Z
• يعمل في Gmail وWhatsApp Web وSlack ومربعات البحث وأغلب المواقع
• نص لا يمكن تعديله (مثل رسالة وصلتك)؟ يُنسخ النص المصحح ويُعرض لك
• مربع لصق وتصحيح في نافذة الإضافة
• زر تحديد اختياري: حدد النص، انقر الأيقونة، واختر اللغة — مع معاينة فورية

**يناسب لوحة مفاتيحك**
• يدعم تخطيط PC العربي (Windows وLinux وChromeOS وmacOS «العربية – PC») وتخطيط «العربية» في macOS —
  يُختار تلقائيًا ويمكن تغييره من الإعدادات
• واجهة بالعربية والإنجليزية، ووضع فاتح وداكن

**خصوصيتك أولًا**
كل شيء يحدث على جهازك. لا جمع بيانات، ولا تتبع، ولا اتصال بالإنترنت.

## Category
Productivity (Chrome Web Store)

## Single purpose (Chrome Web Store)
Convert text typed with the wrong keyboard layout between Arabic and English.

## Permission justifications (Chrome Web Store)
- **activeTab:** Reads and replaces the text the user selected, only on the tab where they pressed the shortcut or used the context menu.
- **scripting:** Injects the conversion script into that tab at the moment the user asks for it; no script runs otherwise.
- **contextMenus:** Adds the "Fix keyboard layout" item to the right-click menu.
- **storage:** Saves the user's settings (languages, Arabic keyboard layout, on-page messages, selection button).
- **Host permissions (optional, `<all_urls>`):** Requested only when the user turns on the optional selection button in Settings, so the button can appear next to text the user selects on any site. Nothing is requested at install; turning the feature off removes the access.
- **Remote code:** No. All code is bundled in the package.

## Data usage disclosures
Collects no user data. Does not sell or transfer data. Does not use data for purposes unrelated to the single purpose.

## Assets

Generated from the real extension with `npm run store:screenshots` (Docker, Linux — so shortcut
labels match Windows, where most Chrome users are). Upload the `en` set to the default listing and
the `ar` set to the Arabic localized listing.

| Asset | Size | Files |
|-------|------|-------|
| Store icon | 128×128 | `public/icons/icon-128.png` |
| Screenshots (5) | 1280×800 | `docs/store/screenshots/{en,ar}/01…05-*.png` |
| Small promo tile | 440×280 | `docs/store/screenshots/{en,ar}/promo-tile-440x280.png` |
| Marquee promo tile | 1400×560 | `docs/store/screenshots/{en,ar}/marquee-1400x560.png` |
| Privacy policy URL | — | https://github.com/BugsBountyHunter/layout-fixer/blob/main/PRIVACY.md |
| Package | — | `layout-fixer-chrome-<version>.zip` from the GitHub Release |

Optional later: a short before/after video for the listing.
