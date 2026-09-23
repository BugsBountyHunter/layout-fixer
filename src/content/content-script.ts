import { loadSettings, resolveLayout } from '../platform/settings'
import { isMacPlatform } from '../platform/shortcut'
import { notify } from './notify'
import { fixActiveElement } from './replace'

const FRAME_TAGS = new Set(['IFRAME', 'FRAME'])

function isFrameElement(el: Element | null): boolean {
  return el !== null && FRAME_TAGS.has(el.tagName)
}

/**
 * Runs on every injection (see content-script.entry.ts). The script is injected into all
 * frames, so only the frame that owns focus acts — a parent whose focused element is an
 * iframe defers to that frame.
 */
export async function onExecute(): Promise<void> {
  if (!document.hasFocus() || isFrameElement(document.activeElement)) return
  const settings = await loadSettings()
  const result = await fixActiveElement({ layout: resolveLayout(settings, isMacPlatform(navigator)) })
  notify(result, settings)
}
