import type { Box } from './Box.ts'

/**
 * Full Box Type (has version and flags)
 *
 * @public
 */
export type FullBox = Box & {
	version: number;
	flags: number;
};
