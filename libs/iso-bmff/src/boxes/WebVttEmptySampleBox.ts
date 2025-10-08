import type { Box } from './Box.js';

/**
 * ISO/IEC 14496-30:2014 - WebVTT Empty Sample Box
 *
 *
 * @beta
 */
export type WebVttEmptySampleBox = Box & {
	type: 'vtte';
};
