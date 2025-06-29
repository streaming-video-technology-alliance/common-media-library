import type { Fields } from '../boxes/Fields.js';
import type { MediaHeaderBox } from '../boxes/MediaHeaderBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a MediaHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MediaHeaderBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function mdhd(view: IsoView): Fields<MediaHeaderBox> {
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
