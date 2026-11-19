import type { SampleDependencyTypeBox } from '../boxes/SampleDependencyTypeBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readBytes } from '../cursor/readBytes.ts'

/**
 * Read the `sdtp` box (`SampleDependencyTypeBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SampleDependencyTypeBox`
 *
 * @public
 */
export function readSdtp(cursor: IsoBoxReadCursor<IsoInt64>): SampleDependencyTypeBox {
	return {
		type: 'sdtp',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		sampleDependencyTable: readBytes(cursor, cursor.end - cursor.pos),
	}
}
