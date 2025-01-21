import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * ISO/IEC 14496-12:2012 - 8.4.2 Media Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MediaHeaderBox = FullBox & {
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
}

// ISO/IEC 14496-12:2012 - 8.4.2 Media Header Box
export function mdhd(view: IsoView): MediaHeaderBox {
	const { version, flags } = view.readFullBox();

	const creationTime = view.readUint(version == 1 ? 8 : 4);
	const modificationTime = view.readUint(version == 1 ? 8 : 4);
	const timescale = view.readUint(4);
	const duration = view.readUint(version == 1 ? 8 : 4);
	const lang = view.readUint(2);
	const language = String.fromCharCode(((lang >> 10) & 0x1F) + 0x60,
		((lang >> 5) & 0x1F) + 0x60,
		(lang & 0x1F) + 0x60);

	const preDefined = view.readUint(2);

	return {
		version,
		flags,
		creationTime,
		modificationTime,
		timescale,
		duration,
		language,
		preDefined,
	};
}
