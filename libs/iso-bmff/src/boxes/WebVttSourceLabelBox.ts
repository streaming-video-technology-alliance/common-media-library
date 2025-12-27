import type { Box } from './Box.ts'

/**
 * ISO/IEC 14496-30:2014 - WebVTT Source Label Box
 *
 * @public
 */
export type WebVttSourceLabelBox = Box & {
	type: 'vlab';
	sourceLabel: string;
};
