import type { Box } from './Box.ts'

/**
 * ISO/IEC 14496-30:2014 - WebVTT Cue Payload Box.
 *
 *
 * @beta
 */
export type WebVttCuePayloadBox = Box & {
	type: 'payl';
	cueText: string;
};
