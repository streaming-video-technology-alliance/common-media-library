import type { Box } from './Box.js';

/**
 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type FreeSpaceBox<T = 'free'> = Box & {
	type: T;
	data: Uint8Array;
};
