import type { Box } from './Box.ts'
import type { BoxType } from './BoxType.ts'

/**
 * Full Box Type (has version and flags)
 *
 *
 * @beta
 */
export type FullBox<T extends BoxType> = Box<T> & {
	version: number;
	flags: number;
};
