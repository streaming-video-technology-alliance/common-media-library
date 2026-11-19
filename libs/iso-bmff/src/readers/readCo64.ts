import type { ChunkLargeOffsetBox } from '../boxes/ChunkLargeOffsetBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readWideUint } from '../cursor/readWideUint.ts'

/**
 * Read the `co64` box (`ChunkLargeOffsetBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.5
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `ChunkLargeOffsetBox`
 *
 * @example
 * {@includeCode ../../test/readers/readCo64.test.ts#example}
 *
 * @public
 */
export function readCo64<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): ChunkLargeOffsetBox<V> {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const entryCount = readUint32(cursor)
	const chunkOffset: V[] = []

	for (let i = 0; i < entryCount; i++) {
		chunkOffset.push(readWideUint(cursor, 8))
	}

	return {
		type: 'co64',
		version,
		flags,
		chunkOffset,
	}
}
