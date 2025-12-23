import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import type { Fields } from '../boxes/Fields.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeTemplate } from './writeTemplate.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write an AudioSampleEntryBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 12.2.3 Audio Sample Entry
 *
 * @param box - The AudioSampleEntryBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeMp4a(box: Fields<AudioSampleEntryBox<'mp4a'>>): Uint8Array {
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

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'mp4a', totalSize)

	for (let i = 0; i < 6; i++) {
		writeUint(dataView, offset, 1, box.reserved1[i] ?? 0)
		offset += 1
	}

	writeUint(dataView, offset, 2, box.dataReferenceIndex)
	offset += 2

	for (let i = 0; i < 2; i++) {
		writeUint(dataView, offset, 4, box.reserved2[i] ?? 0)
		offset += 4
	}

	writeUint(dataView, offset, 2, box.channelcount)
	offset += 2

	writeUint(dataView, offset, 2, box.samplesize)
	offset += 2

	writeUint(dataView, offset, 2, box.preDefined)
	offset += 2

	writeUint(dataView, offset, 2, box.reserved3)
	offset += 2

	writeTemplate(dataView, offset, 4, box.samplerate)
	offset += 4

	result.set(box.esds, offset)

	return result
}

