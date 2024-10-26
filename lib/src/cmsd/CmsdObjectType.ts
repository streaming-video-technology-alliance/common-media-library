/**
 * Common Media Server Data Object Type
 *
 * @group CMSD
 *
 * @beta
 */
export const CmsdObjectType = {
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
 * Common Media Server Data Object Type
 *
 * @group CMSD
 * @see {@link CmsdObjectType}
 *
 * @beta
 */
export type CmsdObjectType = typeof CmsdObjectType[keyof typeof CmsdObjectType];
