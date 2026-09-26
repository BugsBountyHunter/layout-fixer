import type React from 'react'
import { Composition, Folder } from 'remotion'
import { LayoutFixerVideo } from './LayoutFixerVideo'
import { BothWays } from './scenes/BothWays'
import { Everywhere } from './scenes/Everywhere'
import { FixScene } from './scenes/FixScene'
import { Hook } from './scenes/Hook'
import { KeyboardScene } from './scenes/KeyboardScene'
import { Outro } from './scenes/Outro'
import { Private } from './scenes/Private'

// Scene lengths minus the six transitions: 1320 − (15 + 15 + 20 + 20 + 15 + 20) = 1215.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="LayoutFixer"
      component={LayoutFixerVideo}
      durationInFrames={1215}
      fps={30}
      width={1920}
      height={1080}
    />
    <Folder name="Scenes">
      <Composition id="Hook" component={Hook} durationInFrames={150} fps={30} width={1920} height={1080} />
      <Composition id="Keyboard" component={KeyboardScene} durationInFrames={300} fps={30} width={1920} height={1080} />
      <Composition id="Fix" component={FixScene} durationInFrames={210} fps={30} width={1920} height={1080} />
      <Composition id="BothWays" component={BothWays} durationInFrames={150} fps={30} width={1920} height={1080} />
      <Composition id="Everywhere" component={Everywhere} durationInFrames={180} fps={30} width={1920} height={1080} />
      <Composition id="Private" component={Private} durationInFrames={150} fps={30} width={1920} height={1080} />
      <Composition id="Outro" component={Outro} durationInFrames={180} fps={30} width={1920} height={1080} />
    </Folder>
  </>
)
