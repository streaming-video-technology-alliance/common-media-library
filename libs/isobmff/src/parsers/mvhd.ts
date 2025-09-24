import type { Fields } from '../boxes/Fields.js';
import type { MovieHeaderBox } from '../boxes/MovieHeaderBox.js';
import { UINT } from '../fields/UINT.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a Box from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function mvhd(view: IsoView): Fields<MovieHeaderBox> {
	const { readUint, readTemplate, readArray } = view;

	const { version, flags } = view.readFullBox();
	const size = (version == 1) ? 8 : 4;

	return {
		version,
		flags,
		creationTime: readUint(size),
		modificationTime: readUint(size),
		timescale: readUint(4),
		duration: readUint(size),
		rate: readTemplate(4),
		volume: readTemplate(2),
		reserved1: readUint(2),
		reserved2: readArray(UINT, 4, 2),
		matrix: readArray(UINT, 4, 9),
		preDefined: readArray(UINT, 4, 6),
		nextTrackId: readUint(4),
	};
};
