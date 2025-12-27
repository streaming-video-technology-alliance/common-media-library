import type { Box } from './Box.ts'

/**
 * Container Box
 *
 * @public
 */
export type ContainerBox<T> = Box & {
	boxes: T[];
};
