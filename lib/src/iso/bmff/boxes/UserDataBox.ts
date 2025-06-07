import type { Box } from './Box.js';
import type { ContainerBox } from './ContainerBox.js';

/**
 * User Data Box - 'udta' - Container
 */
export type UserDataBox = ContainerBox<Box> & {
	type: 'udta';
};
