import type { Fields } from '../boxes/Fields.js';
import type { TrackHeaderBox } from '../boxes/TrackHeaderBox.js';
import { TEMPLATE } from '../fields/TEMPLATE.js';
import { UINT } from '../fields/UINT.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a TrackHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackHeaderBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function tkhd(view: IsoView): Fields<TrackHeaderBox> {
	const { version, flags } = view.readFullBox();
	const size = version === 1 ? 8 : 4;

	return {
		version,
		flags,
		creationTime: view.readUint(size),
		modificationTime: view.readUint(size),
		trackId: view.readUint(4),
		reserved1: view.readUint(4),
		duration: view.readUint(size),
		reserved2: view.readArray(UINT, 4, 2),
		layer: view.readUint(2),
		alternateGroup: view.readUint(2),
		volume: view.readTemplate(2),
		reserved3: view.readUint(2),
		matrix: view.readArray(TEMPLATE, 4, 9),
		width: view.readTemplate(4),
		height: view.readTemplate(4),
	};
};
