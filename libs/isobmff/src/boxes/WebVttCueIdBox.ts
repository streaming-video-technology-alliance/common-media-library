import type { Box } from './Box.js';

/**
 * ISO/IEC 14496-30:2014 - WebVTT Cue Id Box.
 *
 *
 * @beta
 */
export type WebVttCueIdBox = Box & {
	type: 'iden';
	cueId: string;
};
