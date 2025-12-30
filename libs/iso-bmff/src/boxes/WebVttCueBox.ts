import type { WebVttCueIdBox } from './WebVttCueIdBox.ts'
import type { WebVttCuePayloadBox } from './WebVttCuePayloadBox.ts'

/**
 * Child boxes of WebVttCueBox
 *
 * @public
 */
export type WebVttCueChild = WebVttCueIdBox | WebVttCuePayloadBox;

/**
 * WebVttCueBox - 'vttc' - Container
 *
 * @public
 */
export type WebVttCueBox = {
	type: 'vttc';
	boxes: WebVttCueChild[];
};

/**
 * @public
 */
export type vttc = WebVttCueBox;
