import type { Box } from './Box.js';

/**
 * ISO/IEC 14496-30:2014 - WebVTT Source Label Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type WebVttSourceLabelBox = Box & {
	type: 'vlab';
	sourceLabel: string;
};
