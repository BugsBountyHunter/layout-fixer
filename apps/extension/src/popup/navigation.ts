export function openSettings(): void {
  void chrome.runtime.openOptionsPage()
}

export function openSelectionSetting(): void {
  void chrome.tabs.create({ url: chrome.runtime.getURL('src/options/index.html#selection') })
}
