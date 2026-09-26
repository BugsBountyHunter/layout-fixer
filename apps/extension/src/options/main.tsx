import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { t, uiDirection, uiLanguage } from '../platform/i18n'
import { Options } from './Options'
import '@layout-fixer/ui/theme.css'
import '@layout-fixer/ui/grouped.css'
import './options.css'

document.documentElement.lang = uiLanguage()
document.documentElement.dir = uiDirection()
document.title = `${t('settingsTitle')} — ${t('extName')}`

const root = document.getElementById('root')
if (!root) throw new Error('Options root element not found')

createRoot(root).render(
  <StrictMode>
    <Options />
  </StrictMode>,
)
