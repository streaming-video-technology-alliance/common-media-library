import type { TrackFragmentRandomAccessBox } from '../boxes/TrackFragmentRandomAccessBox.ts'
import type { TrackFragmentRandomAccessEntry } from '../boxes/TrackFragmentRandomAccessEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `tfra` box (`TrackFragmentRandomAccessBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TrackFragmentRandomAccessBox`
 *
 * @public
 */
export function readTfra<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): TrackFragmentRandomAccessBox<V> {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()
	const trackId = view.readUint(4)
	const lengthSizes = view.readUint(4)

	const lengthSizeOfTrafNum = (lengthSizes & 0x00000030) >> 4
	const lengthSizeOfTrunNum = (lengthSizes & 0x0000000c) >> 2
	const lengthSizeOfSampleNum = lengthSizes & 0x00000003

	const numberOfEntry = view.readUint(4)
	const size = version === 1 ? 8 : 4

	const entries = view.readEntries<TrackFragmentRandomAccessEntry<V>>(numberOfEntry, () => ({
		time: view.readWideUint(size),
		moofOffset: view.readWideUint(size),
		trafNumber: view.readUint(lengthSizeOfTrafNum + 1),
		trunNumber: view.readUint(lengthSizeOfTrunNum + 1),
		sampleNumber: view.readUint(lengthSizeOfSampleNum + 1),
	}))

	return {
		type: 'tfra',
		version,
		flags,
		trackId,
		lengthSizeOfTrafNum,
		lengthSizeOfTrunNum,
		lengthSizeOfSampleNum,
		numberOfEntry,
		entries,
	}
}
