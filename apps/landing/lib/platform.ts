interface NavigatorLike {
  readonly platform: string
  readonly userAgentData?: { readonly platform: string }
}

/** Same check as the extension's apps/extension/src/platform/shortcut.ts, which the site can't import. */
export function isMacPlatform(nav: NavigatorLike): boolean {
  const platform = nav.userAgentData?.platform ?? nav.platform
  return /mac|iphone|ipad/i.test(platform)
}
