import type { TrackFragmentRandomAccessBox } from '../boxes/TrackFragmentRandomAccessBox.ts'
import type { TrackFragmentRandomAccessEntry } from '../boxes/TrackFragmentRandomAccessEntry.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `TrackFragmentRandomAccessBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `TrackFragmentRandomAccessBox`
 *
 * @public
 */
export function readTfra<V extends IsoInt64>(
	view: IsoBoxReadView<V>,
): TrackFragmentRandomAccessBox<V> {
	const { version, flags } = view.readFullBox()
	const trackId = view.readUint(4)
	const reserved = view.readUint(4)

	const lengthSizeOfTrafNum = (reserved & 0x00000030) >> 4
	const lengthSizeOfTrunNum = (reserved & 0x0000000c) >> 2
	const lengthSizeOfSampleNum = reserved & 0x00000003

	const numberOfEntry = view.readUint(4)

	const entries = view.readEntries<TrackFragmentRandomAccessEntry<V>>(numberOfEntry, () => ({
		time: view.readWideUint(version === 1 ? 8 : 4),
		moofOffset: view.readWideUint(version === 1 ? 8 : 4),
		trafNumber: view.readUint(lengthSizeOfTrafNum + 1),
		trunNumber: view.readUint(lengthSizeOfTrunNum + 1),
		sampleNumber: view.readUint(lengthSizeOfSampleNum + 1),
	}))

	return {
		type: 'tfra',
		version,
		flags,
		trackId,
		reserved,
		lengthSizeOfTrafNum,
		lengthSizeOfTrunNum,
		lengthSizeOfSampleNum,
		numberOfEntry,
		entries,
	}
}
