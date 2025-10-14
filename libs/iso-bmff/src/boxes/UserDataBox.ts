import type { Box } from './Box.ts';
import type { ContainerBox } from './ContainerBox.ts';

/**
 * User Data Box - 'udta' - Container
 *
 *
 * @beta
 */
export type UserDataBox = ContainerBox<Box> & {
	type: 'udta';
};
