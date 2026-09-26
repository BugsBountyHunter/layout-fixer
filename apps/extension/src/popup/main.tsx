import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { t, uiDirection, uiLanguage } from '../platform/i18n'
import { App } from './App'
import '@layout-fixer/ui/theme.css'
import './popup.css'

document.documentElement.lang = uiLanguage()
document.documentElement.dir = uiDirection()
document.title = t('extName')

const root = document.getElementById('root')
if (!root) throw new Error('Popup root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
