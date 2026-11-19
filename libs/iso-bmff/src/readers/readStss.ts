import type { SyncSampleBox } from '../boxes/SyncSampleBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'

/**
 * Read the `stss` box (`SyncSampleBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SyncSampleBox`
 *
 * @public
 */
export function readStss(cursor: IsoBoxReadCursor<IsoInt64>): SyncSampleBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const entryCount = readUint32(cursor)
	const sampleNumber: number[] = []

	for (let i = 0; i < entryCount; i++) {
		sampleNumber.push(readUint32(cursor))
	}

	return {
		type: 'stss',
		version,
		flags,
		sampleNumber,
	}
}
