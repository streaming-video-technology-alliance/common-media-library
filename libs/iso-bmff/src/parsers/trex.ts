import type { Fields } from '../boxes/Fields.ts';
import type { TrackExtendsBox } from '../boxes/TrackExtendsBox.ts';
import type { IsoView } from '../IsoView.ts';

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
