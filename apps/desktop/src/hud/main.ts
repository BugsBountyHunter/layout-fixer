import { listen } from '@tauri-apps/api/event'
import '@layout-fixer/ui/tokens.css'
import './hud.css'

const pill = document.querySelector<HTMLElement>('.hud')

listen<string>('hud-message', ({ payload }) => {
  if (!pill) return
  pill.textContent = payload
  pill.dir = 'auto'
}).catch((error: unknown) => console.error('[layout-fixer] HUD could not listen for messages:', error))
