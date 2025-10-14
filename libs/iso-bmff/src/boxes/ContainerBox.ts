import type { Box } from './Box.ts';

/**
 * Container Box
 *
 *
 * @beta
 */
export type ContainerBox<T> = Box & {
	boxes: Array<T>;
};
