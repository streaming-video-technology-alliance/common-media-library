import type { SampleToChunkBox } from '../boxes/SampleToChunkBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `SampleToChunkBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 14496-12:2012 - 8.7.4 Sample to Chunk Box
 *
 * @param box - The `SampleToChunkBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeStsc(box: SampleToChunkBox): IsoBoxWriteView {
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

	return writer
}
