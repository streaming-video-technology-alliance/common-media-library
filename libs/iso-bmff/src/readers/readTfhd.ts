import type { TrackFragmentHeaderBox } from '../boxes/TrackFragmentHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `tfhd` box (`TrackFragmentHeaderBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TrackFragmentHeaderBox`
 *
 * @public
 */
export function readTfhd<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): TrackFragmentHeaderBox<V> {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()

	return {
		type: 'tfhd',
		version,
		flags,
		trackId: view.readUint(4),
		baseDataOffset: flags & 0x01 ? view.readWideUint(8) : undefined,
		sampleDescriptionIndex: flags & 0x02 ? view.readUint(4) : undefined,
		defaultSampleDuration: flags & 0x08 ? view.readUint(4) : undefined,
		defaultSampleSize: flags & 0x10 ? view.readUint(4) : undefined,
		defaultSampleFlags: flags & 0x20 ? view.readUint(4) : undefined,
	}
}
