import type { Box } from './Box.js';

/**
 * Container Box
 *
 *
 * @beta
 */
export type ContainerBox<T> = Box & {
	boxes: Array<T>;
};
