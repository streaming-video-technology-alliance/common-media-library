import type { TrackFragmentBaseMediaDecodeTimeBox } from '../boxes/TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `TrackFragmentBaseMediaDecodeTimeBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `TrackFragmentBaseMediaDecodeTimeBox`
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
