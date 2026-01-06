import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import { UINT } from '../fields/UINT.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write an AudioSampleEntryBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 12.2.3 Audio Sample Entry
 *
 * @param box - The AudioSampleEntryBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeMp4a(box: AudioSampleEntryBox<'mp4a'>): IsoBoxWriteView {
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

	const writer = new IsoBoxWriteView('mp4a', totalSize)

	writer.writeArray(box.reserved1, UINT, 1, 6)
	writer.writeUint(box.dataReferenceIndex, 2)
	writer.writeArray(box.reserved2, UINT, 4, 2)
	writer.writeUint(box.channelcount, 2)
	writer.writeUint(box.samplesize, 2)
	writer.writeUint(box.preDefined, 2)
	writer.writeUint(box.reserved3, 2)
	writer.writeTemplate(box.samplerate, 4)
	writer.writeBytes(box.esds)

	return writer
}
