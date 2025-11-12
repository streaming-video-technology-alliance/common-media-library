import type { Box } from './Box.ts'

/**
 * ISO/IEC 14496-30:2014 - WebVTT Cue Id Box.
 *
 *
 * @beta
 */
export type WebVttCueIdBox = Box<'iden'> & {
	cueId: string;
};
