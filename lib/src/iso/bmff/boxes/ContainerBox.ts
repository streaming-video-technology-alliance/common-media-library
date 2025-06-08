import type { Box } from './Box.js';

/**
 * Container Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type ContainerBox<T> = Box & {
	boxes: Array<T>;
};
