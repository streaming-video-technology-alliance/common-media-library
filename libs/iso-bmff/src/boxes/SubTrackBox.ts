/**
 * Child boxes of Sub Track Box
 *
 * @public
 */
export type SubTrackBoxChild = any;

/**
 * Sub track box - 'strk'
 *
 * @public
 */
export type SubTrackBox = {
	type: 'strk';
	boxes: SubTrackBoxChild[];
};
