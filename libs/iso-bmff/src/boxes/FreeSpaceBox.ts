
/**
 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
 *
 * @public
 */
export type FreeSpaceBox<T extends 'free' | 'skip' = 'free'> = {
	type: T;
	data: Uint8Array;
};
