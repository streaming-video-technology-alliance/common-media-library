/**
 * Decoded ID3 frame.
 *
 * @public
 */
export type DecodedId3Frame<T> = {
	/**
	 * The four letter frame ID.
	 */
	key: string;

	/**
	 * The data payload.
	 */
	data: T;

	/**
	 * A text description of the frame if provided.
	 */
	info?: any;
};
