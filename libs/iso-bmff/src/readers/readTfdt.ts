import type { TrackFragmentBaseMediaDecodeTimeBox } from '../boxes/TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a TrackFragmentDecodeTimeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackFragmentDecodeTimeBox
 *
 * @public
 */
export function readTfdt(view: IsoBoxReadView): TrackFragmentBaseMediaDecodeTimeBox {
	const { version, flags } = view.readFullBox()

	return {
		type: 'tfdt',
		version,
		flags,
		baseMediaDecodeTime: view.readUint((version == 1) ? 8 : 4),
	}
};
