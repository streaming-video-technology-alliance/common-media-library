import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { ChunkOffsetBox } from '../boxes/ChunkOffsetBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `stco` box (`ChunkOffsetBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.5
 *
 * @param cursor - The write cursor
 * @param box - The `ChunkOffsetBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @example
 * {@includeCode ../../test/writers/writeStco.test.ts#example}
 *
 * @public
 */
export function writeStco(cursor: IsoBoxWriteCursor, box: ChunkOffsetBox): void {
	const start = beginIsoFullBox(cursor, 'stco', box.version, box.flags)

	writeUint32(cursor, box.chunkOffset.length)

	for (const offset of box.chunkOffset) {
		writeUint32(cursor, offset)
	}

	endIsoBox(cursor, start)
}
