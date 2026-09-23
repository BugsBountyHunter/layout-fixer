import { useRef, useState } from 'react'
import { convert } from '../core/converter'
import { resolveLayout } from '../platform/settings'
import { isMacPlatform } from '../platform/shortcut'
import { usePlatform } from '../ui/usePlatform'
import { useSettings } from '../ui/useSettings'
import { type DirectionChoice, DirectionToggle } from './components/DirectionToggle'
import { PopupHeader } from './components/PopupHeader'
import { ResultPane } from './components/ResultPane'
import { SelectionPromo } from './components/SelectionPromo'
import { ShortcutHint } from './components/ShortcutHint'
import { SourcePane } from './components/SourcePane'
import { useCopy } from './useCopy'

export function App() {
  const platform = usePlatform()
  const { settings } = useSettings()
  const layout = resolveLayout(settings, isMacPlatform(navigator))
  const [input, setInput] = useState('')
  const [direction, setDirection] = useState<DirectionChoice>('auto')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const output = input ? convert(input, { direction: direction === 'auto' ? undefined : direction, layout }) : ''
  const { copied, copy } = useCopy(output)

  function clear() {
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <main className="popup">
      <PopupHeader />
      <div className="pane">
        <SourcePane
          value={input}
          inputRef={inputRef}
          onChange={setInput}
          onClear={clear}
          onSubmit={() => void copy()}
        />
        <div className="pane-bar">
          <DirectionToggle value={direction} onChange={setDirection} />
        </div>
        <ResultPane output={output} layout={layout} copied={copied} onCopy={() => void copy()} />
      </div>
      {!settings.selectionButton && <SelectionPromo />}
      <ShortcutHint {...platform} />
    </main>
  )
}
