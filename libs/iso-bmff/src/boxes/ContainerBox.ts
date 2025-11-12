import type { Box } from './Box.ts'
import type { BoxType } from './BoxType.ts'

/**
 * Container Box
 *
 *
 * @beta
 */
export type ContainerBox<T extends BoxType, B> = Box<T> & {
	boxes: B[];
};
