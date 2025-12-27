import type { Box } from './Box.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
 *
 * @public
 */
export type MediaDataBox = Box & {
	type: 'mdat';
	data: Uint8Array<ArrayBuffer>;
};
