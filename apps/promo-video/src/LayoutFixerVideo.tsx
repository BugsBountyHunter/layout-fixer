import { linearTiming, springTiming, TransitionSeries } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'
import type React from 'react'
import { BothWays } from './scenes/BothWays'
import { Everywhere } from './scenes/Everywhere'
import { FixScene } from './scenes/FixScene'
import { Hook } from './scenes/Hook'
import { KeyboardScene } from './scenes/KeyboardScene'
import { Outro } from './scenes/Outro'
import { Private } from './scenes/Private'

export const LayoutFixerVideo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={150} name="Hook">
      <Hook />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence durationInFrames={300} name="Keyboard">
      <KeyboardScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence durationInFrames={210} name="Fix">
      <FixScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({ direction: 'from-right' })}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
    />
    <TransitionSeries.Sequence durationInFrames={150} name="Both ways">
      <BothWays />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({ direction: 'from-bottom' })}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
    />
    <TransitionSeries.Sequence durationInFrames={180} name="Everywhere">
      <Everywhere />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence durationInFrames={150} name="Private">
      <Private />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 20 })} />
    <TransitionSeries.Sequence durationInFrames={180} name="Outro">
      <Outro />
    </TransitionSeries.Sequence>
  </TransitionSeries>
)
