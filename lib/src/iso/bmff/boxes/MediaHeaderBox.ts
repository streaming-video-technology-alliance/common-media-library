import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.4.2 Media Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MediaHeaderBox = FullBox & {
	type: 'mdhd';

	/** A 32-bit integer that specifies the creation time of the media in this track. */
	creationTime: number;

	/** A 32-bit integer that specifies the most recent time the media in this track was modified. */
	modificationTime: number;

	/** A time value that indicates the time-scale for this media; this is the number of time units that pass in one second. */
	timescale: number;

	/** A time value that indicates the duration of this media. */
	duration: number;

	/** A 16-bit integer that specifies the language code for this media. */
	language: string;

	/** A 16-bit value that is reserved for use in other specifications. */
	preDefined: number;
};
