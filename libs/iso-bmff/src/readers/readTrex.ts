import type { Fields } from '../boxes/Fields.ts'
import type { TrackExtendsBox } from '../boxes/TrackExtendsBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a TrackExtendsBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackExtendsBox
 *
 * @public
 */
export function readTrex(view: IsoBoxReadView): Fields<TrackExtendsBox> {
	return {
		...view.readFullBox(),
		trackId: view.readUint(4),
		defaultSampleDescriptionIndex: view.readUint(4),
		defaultSampleDuration: view.readUint(4),
		defaultSampleSize: view.readUint(4),
		defaultSampleFlags: view.readUint(4),
	}
};
