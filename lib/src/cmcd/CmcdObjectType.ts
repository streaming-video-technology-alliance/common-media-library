/**
 * Common Media Client Data Object Type
 *
 * @group CMCD
 *
 * @beta
 */
export const CmcdObjectType = {
	/**
	 * text file, such as a manifest or playlist
	 */
	MANIFEST: 'm',

	/**
	 * audio only
	 */
	AUDIO: 'a',

	/**
	 * video only
	 */
	VIDEO: 'v',

	/**
	 * muxed audio and video
	 */
	MUXED: 'av',

	/**
	 * init segment
	 */
	INIT: 'i',

	/**
	 * caption or subtitle
	 */
	CAPTION: 'c',

	/**
	 * ISOBMFF timed text track
	 */
	TIMED_TEXT: 'tt',

	/**
	 * cryptographic key, license or certificate.
	 */
	KEY: 'k',

	/**
	 * other
	 */
	OTHER: 'o',
} as const;

/**
 * Common Media Client Data Object Type
 *
 * @group CMCD
 *
 * @see {@link CmcdObjectType}
 *
 * @beta
 */
export type CmcdObjectType = typeof CmcdObjectType[keyof typeof CmcdObjectType];
