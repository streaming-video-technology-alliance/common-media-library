import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write an AudioSampleEntryBox (enca) to an IsoDataWriter.
 *
 * @param box - The AudioSampleEntryBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeEnca(box: AudioSampleEntryBox<'enca'>): IsoBoxWriteView {
	const headerSize = 8
	const reserved1Size = 6
	const dataReferenceIndexSize = 2
	const reserved2Size = 8 // 2 x 4 bytes
	const channelcountSize = 2
	const samplesizeSize = 2
	const preDefinedSize = 2
	const reserved3Size = 2
	const samplerateSize = 4
	const esdsSize = box.esds.length
	const totalSize = headerSize + reserved1Size + dataReferenceIndexSize + reserved2Size +
		channelcountSize + samplesizeSize + preDefinedSize + reserved3Size + samplerateSize + esdsSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('enca', totalSize)

	for (let i = 0; i < 6; i++) {
		writer.writeUint(box.reserved1[i] ?? 0, 1)
	}

	writer.writeUint(box.dataReferenceIndex, 2)

	for (let i = 0; i < 2; i++) {
		writer.writeUint(box.reserved2[i] ?? 0, 4)
	}

	writer.writeUint(box.channelcount, 2)
	writer.writeUint(box.samplesize, 2)
	writer.writeUint(box.preDefined, 2)
	writer.writeUint(box.reserved3, 2)
	writer.writeTemplate(box.samplerate, 4)
	writer.writeBytes(box.esds)

	return writer
}
