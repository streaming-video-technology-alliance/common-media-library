import type { Box } from './Box.ts';

/**
 * ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
 *
 *
 * @beta
 */
export type OriginalFormatBox = Box & {
	type: 'frma';
	dataFormat: number;
};
