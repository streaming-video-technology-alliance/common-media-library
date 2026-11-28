import type { TrackExtendsBox } from '../boxes/TrackExtendsBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'

/**
 * Read the `trex` box (`TrackExtendsBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TrackExtendsBox`
 *
 * @public
 */
export function readTrex(cursor: IsoBoxReadCursor<IsoInt64>): TrackExtendsBox {
	return {
		type: 'trex',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		trackId: readUint32(cursor),
		defaultSampleDescriptionIndex: readUint32(cursor),
		defaultSampleDuration: readUint32(cursor),
		defaultSampleSize: readUint32(cursor),
		defaultSampleFlags: readUint32(cursor),
	}
}
