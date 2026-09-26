import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Settings } from './Settings'
import '@layout-fixer/ui/theme.css'
import '@layout-fixer/ui/grouped.css'
import './settings.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <Settings />
  </StrictMode>,
)
