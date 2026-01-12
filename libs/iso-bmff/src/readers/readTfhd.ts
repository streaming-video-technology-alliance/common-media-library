import type { TrackFragmentHeaderBox } from '../boxes/TrackFragmentHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `TrackFragmentHeaderBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `TrackFragmentHeaderBox`
 *
 * @public
 */
export function readTfhd(view: IsoBoxReadView): TrackFragmentHeaderBox {
	const { version, flags } = view.readFullBox()

	return {
		type: 'tfhd',
		version,
		flags,
		trackId: view.readUint(4),
		baseDataOffset: flags & 0x01 ? view.readUint(8) : undefined,
		sampleDescriptionIndex: flags & 0x02 ? view.readUint(4) : undefined,
		defaultSampleDuration: flags & 0x08 ? view.readUint(4) : undefined,
		defaultSampleSize: flags & 0x10 ? view.readUint(4) : undefined,
		defaultSampleFlags: flags & 0x20 ? view.readUint(4) : undefined,
	}
};
