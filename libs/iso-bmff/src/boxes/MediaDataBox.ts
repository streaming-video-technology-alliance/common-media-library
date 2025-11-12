import type { Box } from './Box.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
 *
 *
 * @beta
 */
export type MediaDataBox = Box<'mdat'> & {
	data: Uint8Array<ArrayBuffer>;
};
