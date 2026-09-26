import type { Messages } from './en'

export const AR: Messages = {
  appName: 'مصحح لغة الكيبورد',
  subtitle: 'صحّح النص المكتوب بلغة الكيبورد الخطأ، في أي تطبيق.',
  loadError: 'تعذّر تحميل إعداداتك. تُعرض الإعدادات الافتراضية.',

  trayFix: 'تصحيح النص المحدد',
  trayPause: 'إيقاف مؤقت',
  trayResume: 'استئناف',
  traySettings: 'الإعدادات…',
  trayQuit: 'إنهاء مصحح لغة الكيبورد',

  hudNothingSelected: 'حدد النص أولًا',
  hudNothingToFix: 'لا يوجد ما يحتاج إلى تصحيح',
  hudAccessibility: 'اسمح لمصحح لغة الكيبورد في إعدادات تسهيلات الاستخدام',
  hudSecureInput: 'لا يمكن تصحيح النص في حقول كلمات المرور',
  hudElevated: 'لا يمكن تصحيح النص في تطبيقات تعمل كمسؤول',
  hudWayland: 'يحتاج تصحيح النص إلى جلسة X11 على Linux حاليًا',
  hudUnsupported: 'تصحيح النص غير متاح على هذا النظام بعد',
  hudFailed: 'تعذّر تصحيح النص',

  accessSection: 'الإذن',
  accessLabel: 'تسهيلات الاستخدام',
  accessAllowed: 'مسموح',
  accessButton: 'السماح…',
  accessHint:
    'يضغط التطبيق ⌘C و⌘V نيابةً عنك، ولا يسمح macOS بذلك إلا بعد تفعيله في إعدادات النظام ← الخصوصية والأمن ← تسهيلات الاستخدام.',
  accessAllowedHint: 'يمكن للتطبيق نسخ النص الذي تحدده ولصقه.',

  shortcutSection: 'اختصار لوحة المفاتيح',
  shortcutLabel: 'تصحيح النص المحدد',
  shortcutHint: 'حدد النص في أي تطبيق واضغط الاختصار. يمكنك أيضًا استخدام «تصحيح النص المحدد» من شريط القوائم.',
  shortcutTaken: 'يستخدم تطبيق آخر هذا الاختصار. اختر اختصارًا آخر.',
  shortcutChange: 'تغيير',
  shortcutRecording: 'اضغط الاختصار الجديد…',
  shortcutCancel: 'إلغاء',
  shortcutReset: 'إعادة التعيين',
  shortcutNeedsModifier: 'استخدم Ctrl أو Alt أو ⌘ مع حرف أو رقم أو مفتاح F.',
  shortcutReserved: 'يستخدم النظام هذا الاختصار. اختر اختصارًا آخر.',

  generalSection: 'عام',
  launchAtLogin: 'الفتح عند تسجيل الدخول',
  showMessages: 'إظهار الرسائل على الشاشة',
  showMessagesHint: 'تظهر رسالة قصيرة عند عدم تحديد نص أو تعذّر تصحيحه.',
  language: 'اللغة',
  languageAuto: 'مثل النظام',

  layoutSection: 'تخطيط لوحة المفاتيح العربية',
  layoutAuto: 'تلقائي',
  layoutAutoHint: (current: string) => `يستخدم تخطيط Mac على macOS وتخطيط PC في غيره. المستخدم الآن: ${current}.`,
  layoutPc: 'PC',
  layoutPcHint: '‏Windows «العربية (101)»، وmacOS «العربية – PC»، وLinux.',
  layoutMac: 'Mac',
  layoutMacHint: 'تخطيط «العربية» الافتراضي على macOS.',
  layoutExample: (keys: string, word: string) => `كتابة ${keys} تعطي ${word}`,

  waylandTitle: 'جلسة Wayland',
  waylandBody:
    'لا يسمح Wayland حاليًا للتطبيقات بالضغط على المفاتيح داخل تطبيقات أخرى، لذا لا يعمل التصحيح في هذه الجلسة. سجّل الدخول بجلسة X11 ‏(Xorg) لاستخدام التطبيق، ودعم Wayland مخطط له.',

  updatesSection: 'التحديثات',
  autoUpdate: 'التحقق من التحديثات تلقائيًا',
  updateCheckNow: 'التحقق الآن',
  updateChecking: 'جارٍ التحقق…',
  updateCurrent: 'لديك أحدث إصدار.',
  updateAvailable: (version: string) => `الإصدار ${version} متاح.`,
  updateInstall: 'التثبيت وإعادة التشغيل',
  updateInstalling: 'جارٍ التثبيت…',
  updateFailed: 'تعذّر التحقق من التحديثات. حاول لاحقًا.',
  updateHint: 'تأتي التحديثات من إصدارات المشروع على GitHub ويُتحقق منها قبل تثبيتها.',
  appVersion: (version: string) => `الإصدار ${version}`,
  trayUpdate: (version: string) => `التحديث إلى ${version}…`,

  privacyTitle: 'الخصوصية',
  privacyBody: 'لا يقرأ التطبيق النص إلا عندما تضغط الاختصار، ويحوّله على جهازك، ولا يخزّنه أو يرسله أبدًا.',

  welcomeTitle: 'مرحبًا بك في مصحح لغة الكيبورد',
  welcomeBody: 'كتبت جملة بلغة الكيبورد الخطأ؟ حددها في أي تطبيق واضغط الاختصار.',
  welcomeTry: 'جرّبه: حدد النص التالي واضغط',
  welcomeSample: 'hgsghl ugd;l',
  welcomeTryLabel: 'نص للتجربة',
  welcomeDone: 'تم',
}
