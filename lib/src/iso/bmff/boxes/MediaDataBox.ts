import type { Box } from './Box.js';

/**
 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MediaDataBox = Box & {
	type: 'mdat';
	data: Uint8Array;
};
