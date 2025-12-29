import type { ContainerBox } from './ContainerBox.ts'

/**
 * User Data Box - 'udta' - Container
 *
 * @public
 */
export type UserDataBox = ContainerBox<any> & {
	type: 'udta';
};

/**
 * @public
 */
export type udta = UserDataBox;
