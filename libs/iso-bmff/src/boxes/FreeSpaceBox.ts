import type { Box } from './Box.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
 *
 *
 * @beta
 */
export type FreeSpaceBox<T extends 'free' | 'skip' = 'free'> = Box<T> & {
	data: Uint8Array;
};
