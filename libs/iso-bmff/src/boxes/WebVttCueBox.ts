import type { WebVttCueIdBox } from './WebVttCueIdBox.ts'
import type { WebVttCuePayloadBox } from './WebVttCuePayloadBox.ts'

/**
 * Child boxes of WebVTT Cue Box
 *
 * @public
 */
export type WebVttCueChild = WebVttCueIdBox | WebVttCuePayloadBox

/**
 * WebVTT Cue Box (`vttc`).
 *
 * ISO/IEC 14496-30:2014
 *
 * @public
 */
export type WebVttCueBox = {
	type: 'vttc'
	boxes: WebVttCueChild[]
}
