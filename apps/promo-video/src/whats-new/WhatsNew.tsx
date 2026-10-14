import { linearTiming, springTiming, TransitionSeries } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'
import type React from 'react'
import { Ending } from './Ending'
import { MixedText } from './MixedText'
import { NoSelection } from './NoSelection'
import { Title } from './Title'

export const SCENES = { title: 75, mixed: 210, noSelection: 240, ending: 135 } as const
const TRANSITIONS = [15, 20, 15] as const
export const WHATS_NEW_FRAMES =
  Object.values(SCENES).reduce((sum, frames) => sum + frames, 0) - TRANSITIONS.reduce((sum, frames) => sum + frames, 0)

/** "What's new in 1.3" for social feeds: 1080×1080, each fix computed by the real core. */
export const WhatsNew: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={SCENES.title} name="Title">
      <Title />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITIONS[0] })} />
    <TransitionSeries.Sequence durationInFrames={SCENES.mixed} name="Mixed text">
      <MixedText />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({ direction: 'from-right' })}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITIONS[1] })}
    />
    <TransitionSeries.Sequence durationInFrames={SCENES.noSelection} name="No selection">
      <NoSelection />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITIONS[2] })} />
    <TransitionSeries.Sequence durationInFrames={SCENES.ending} name="Ending">
      <Ending />
    </TransitionSeries.Sequence>
  </TransitionSeries>
)
