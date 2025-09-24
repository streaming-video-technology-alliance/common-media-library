import type { Box } from './Box.js';

/**
 * ISO/IEC 14496-30:2014 - WebVTT Cue Payload Box.
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type WebVttCuePayloadBox = Box & {
	type: 'payl';
	cueText: string;
};
