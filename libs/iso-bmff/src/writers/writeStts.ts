import type { DecodingTimeToSampleBox } from '../boxes/DecodingTimeToSampleBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `DecodingTimeToSampleBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 14496-12:2012 - 8.6.1.2 Decoding Time to Sample Box
 *
 * @param box - The `DecodingTimeToSampleBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeStts(box: DecodingTimeToSampleBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entriesSize = box.entryCount * 8 // 4 bytes sampleCount + 4 bytes sampleDelta
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const writer = new IsoBoxWriteView('stts', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.entryCount, 4)

	for (const entry of box.entries) {
		writer.writeUint(entry.sampleCount, 4)
		writer.writeUint(entry.sampleDelta, 4)
	}

	return writer
}
