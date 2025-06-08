import type { Box } from './Box.js';

/**
 * Full Box Type (has version and flags)
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type FullBox = Box & {
	version: number;
	flags: number;
};
