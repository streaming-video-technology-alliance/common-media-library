/**
 * Child boxes of User Data Box
 *
 * @public
 */
export type UserDataBoxChild = any;

/**
 * User Data Box - 'udta' - Container
 *
 * @public
 */
export type UserDataBox = {
	type: 'udta';
	boxes: UserDataBoxChild[];
};

/**
 * @public
 */
export type udta = UserDataBox;
