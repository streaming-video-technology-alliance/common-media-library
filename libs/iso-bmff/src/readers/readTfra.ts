import type { TrackFragmentRandomAccessBox } from '../boxes/TrackFragmentRandomAccessBox.ts'
import type { TrackFragmentRandomAccessEntry } from '../boxes/TrackFragmentRandomAccessEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint16 } from '../cursor/readUint16.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readWideUint } from '../cursor/readWideUint.ts'

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
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const trackId = readUint32(cursor)
	const lengthSizes = readUint32(cursor)

	const lengthSizeOfTrafNum = (lengthSizes & 0x00000030) >> 4
	const lengthSizeOfTrunNum = (lengthSizes & 0x0000000c) >> 2
	const lengthSizeOfSampleNum = lengthSizes & 0x00000003

	const numberOfEntry = readUint32(cursor)
	const size = version === 1 ? 8 : 4
	const entries: TrackFragmentRandomAccessEntry<V>[] = []

	const readNumber = (lengthSize: number): number =>
		lengthSize === 0
			? readUint8(cursor)
			: lengthSize === 1
				? readUint16(cursor)
				: lengthSize === 2
					? readUint24(cursor)
					: readUint32(cursor)

	for (let i = 0; i < numberOfEntry; i++) {
		entries.push({
			time: readWideUint(cursor, size),
			moofOffset: readWideUint(cursor, size),
			trafNumber: readNumber(lengthSizeOfTrafNum),
			trunNumber: readNumber(lengthSizeOfTrunNum),
			sampleNumber: readNumber(lengthSizeOfSampleNum),
		})
	}

	return {
		type: 'tfra',
		version,
		flags,
		trackId,
		lengthSizeOfTrafNum,
		lengthSizeOfTrunNum,
		lengthSizeOfSampleNum,
		entries,
	}
}
