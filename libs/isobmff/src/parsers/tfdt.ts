import type { Fields } from '../boxes/Fields.js';
import type { TrackFragmentBaseMediaDecodeTimeBox } from '../boxes/TrackFragmentBaseMediaDecodeTimeBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a TrackFragmentDecodeTimeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackFragmentDecodeTimeBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function tfdt(view: IsoView): Fields<TrackFragmentBaseMediaDecodeTimeBox> {
	const { version, flags } = view.readFullBox();

	return {
		version,
		flags,
		baseMediaDecodeTime: view.readUint((version == 1) ? 8 : 4),
	};
};
