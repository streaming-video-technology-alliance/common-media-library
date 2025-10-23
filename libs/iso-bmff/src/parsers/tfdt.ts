import type { Fields } from '../boxes/Fields.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from '../boxes/TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { IsoView } from '../IsoView.ts'

/**
 * Parse a TrackFragmentDecodeTimeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackFragmentDecodeTimeBox
 *
 *
 * @beta
 */
export function tfdt(view: IsoView): Fields<TrackFragmentBaseMediaDecodeTimeBox> {
	const { version, flags } = view.readFullBox()

	return {
		version,
		flags,
		baseMediaDecodeTime: view.readUint((version == 1) ? 8 : 4),
	}
};
