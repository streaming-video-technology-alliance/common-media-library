import type { ChunkOffsetBox } from '../boxes/ChunkOffsetBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'

/**
 * Read the `stco` box (`ChunkOffsetBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.5
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `ChunkOffsetBox`
 *
 * @example
 * {@includeCode ../../test/readers/readStco.test.ts#example}
 *
 * @public
 */
export function readStco(cursor: IsoBoxReadCursor<IsoInt64>): ChunkOffsetBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const entryCount = readUint32(cursor)
	const chunkOffset: number[] = []

	for (let i = 0; i < entryCount; i++) {
		chunkOffset.push(readUint32(cursor))
	}

	return {
		type: 'stco',
		version,
		flags,
		chunkOffset,
	}
}
