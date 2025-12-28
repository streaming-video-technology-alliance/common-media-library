import type { Box } from './Box.ts'
import type { ContainerBox } from './ContainerBox.ts'

/**
 * User Data Box - 'udta' - Container
 *
 * @public
 */
export type UserDataBox = ContainerBox<Box> & {
	type: 'udta';
};

/**
 * @public
 */
export type udta = UserDataBox;
