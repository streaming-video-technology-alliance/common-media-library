import type { Fields } from '../boxes/Fields.js';
import type { TrackExtendsBox } from '../boxes/TrackExtendsBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a TrackExtendsBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackExtendsBox
 *
 *
 * @beta
 */
export function trex(view: IsoView): Fields<TrackExtendsBox> {
	return {
		...view.readFullBox(),
		trackId: view.readUint(4),
		defaultSampleDescriptionIndex: view.readUint(4),
		defaultSampleDuration: view.readUint(4),
		defaultSampleSize: view.readUint(4),
		defaultSampleFlags: view.readUint(4),
	};
};
