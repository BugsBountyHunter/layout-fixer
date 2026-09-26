import { loadFont as loadMono } from '@remotion/google-fonts/IBMPlexMono'
import { loadFont as loadSans } from '@remotion/google-fonts/IBMPlexSansArabic'

// The same family the logo artwork is drawn with; it covers Arabic and Latin in one face.
export const sans = loadSans('normal', { weights: ['400', '600', '700'], subsets: ['arabic', 'latin'] }).fontFamily
export const mono = loadMono('normal', { weights: ['400', '500'], subsets: ['latin'] }).fontFamily
