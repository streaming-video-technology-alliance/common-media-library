import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { SampleToChunkBox } from '../boxes/SampleToChunkBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

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
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entriesSize = box.entryCount * 12 // 4 bytes firstChunk + 4 bytes samplesPerChunk + 4 bytes sampleDescriptionIndex
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const writer = new IsoBoxWriteView('stsc', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.entryCount, 4)

	for (const entry of box.entries) {
		writer.writeUint(entry.firstChunk, 4)
		writer.writeUint(entry.samplesPerChunk, 4)
		writer.writeUint(entry.sampleDescriptionIndex, 4)
	}

	writeLegacyView(cursor, writer)
}
