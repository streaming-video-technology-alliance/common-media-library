import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SampleToChunkBox } from '../boxes/SampleToChunkBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `stsc` box (`SampleToChunkBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.4
 *
 * @param cursor - The write cursor
 * @param box - The `SampleToChunkBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeStsc.test.ts#example}
 *
 * @public
 */
export function writeStsc(cursor: IsoBoxWriteCursor, box: SampleToChunkBox): void {
	const start = beginIsoFullBox(cursor, 'stsc', box.version, box.flags)

	writeUint32(cursor, box.entries.length)

	for (const entry of box.entries) {
		writeUint32(cursor, entry.firstChunk)
		writeUint32(cursor, entry.samplesPerChunk)
		writeUint32(cursor, entry.sampleDescriptionIndex)
	}

	endIsoBox(cursor, start)
}
