import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { ChunkLargeOffsetBox } from '../boxes/ChunkLargeOffsetBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeWideUint } from '../cursor/writeWideUint.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `co64` box (`ChunkLargeOffsetBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.5
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `ChunkLargeOffsetBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeCo64.test.ts#example}
 *
 * @public
 */
export function writeCo64(cursor: IsoBoxWriteCursor, box: ChunkLargeOffsetBox<IsoInt64>): void {
	const start = beginIsoFullBox(cursor, 'co64', box.version, box.flags)

	writeUint32(cursor, box.chunkOffset.length)

	for (const offset of box.chunkOffset) {
		writeWideUint(cursor, offset, 8)
	}

	endIsoBox(cursor, start)
}
