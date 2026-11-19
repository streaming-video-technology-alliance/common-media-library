import type { TimeToSampleBox } from '../boxes/TimeToSampleBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import type { TimeToSampleEntry } from '../boxes/TimeToSampleEntry.ts'

/**
 * Read the `stts` box (`TimeToSampleBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TimeToSampleBox`
 *
 * @public
 */
export function readStts(cursor: IsoBoxReadCursor<IsoInt64>): TimeToSampleBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const entryCount = readUint32(cursor)
	const entries: TimeToSampleEntry[] = []

	for (let i = 0; i < entryCount; i++) {
		entries.push({
			sampleCount: readUint32(cursor),
			sampleDelta: readUint32(cursor),
		})
	}

	return {
		type: 'stts',
		version,
		flags,
		entries,
	}
}
