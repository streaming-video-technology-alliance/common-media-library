import type { Fields } from '../boxes/Fields.ts'
import type { VisualSampleEntryBox } from '../boxes/VisualSampleEntryBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeTemplate } from './writeTemplate.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a VisualSampleEntryBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 12.1.3 Visual Sample Entry
 *
 * @param box - The VisualSampleEntryBox fields to write
 * @param boxType - The box type (defaults to 'avc1')
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeAvc1(box: Fields<VisualSampleEntryBox<'avc1'>>, boxType: string = 'avc1'): Uint8Array {
	const headerSize = 8
	const reserved1Size = 6
	const dataReferenceIndexSize = 2
	const preDefined1Size = 2
	const reserved2Size = 2
	const preDefined2Size = 12 // 3 x 4 bytes
	const widthSize = 2
	const heightSize = 2
	const horizresolutionSize = 4
	const vertresolutionSize = 4
	const reserved3Size = 4
	const frameCountSize = 2
	const compressorNameSize = 32
	const depthSize = 2
	const preDefined3Size = 2
	const configSize = box.config.length
	const totalSize = headerSize + reserved1Size + dataReferenceIndexSize + preDefined1Size +
		reserved2Size + preDefined2Size + widthSize + heightSize + horizresolutionSize +
		vertresolutionSize + reserved3Size + frameCountSize + compressorNameSize +
		depthSize + preDefined3Size + configSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, boxType, totalSize)

	for (let i = 0; i < 6; i++) {
		writeUint(dataView, offset, 1, box.reserved1[i] ?? 0)
		offset += 1
	}

	writeUint(dataView, offset, 2, box.dataReferenceIndex)
	offset += 2

	writeUint(dataView, offset, 2, box.preDefined1)
	offset += 2

	writeUint(dataView, offset, 2, box.reserved2)
	offset += 2

	for (let i = 0; i < 3; i++) {
		writeUint(dataView, offset, 4, box.preDefined2[i] ?? 0)
		offset += 4
	}

	writeUint(dataView, offset, 2, box.width)
	offset += 2

	writeUint(dataView, offset, 2, box.height)
	offset += 2

	writeTemplate(dataView, offset, 4, box.horizresolution)
	offset += 4

	writeTemplate(dataView, offset, 4, box.vertresolution)
	offset += 4

	writeUint(dataView, offset, 4, box.reserved3)
	offset += 4

	writeUint(dataView, offset, 2, box.frameCount)
	offset += 2

	for (let i = 0; i < 32; i++) {
		writeUint(dataView, offset, 1, box.compressorName[i] ?? 0)
		offset += 1
	}

	writeUint(dataView, offset, 2, box.depth)
	offset += 2

	writeUint(dataView, offset, 2, box.preDefined3 & 0xFFFF)
	offset += 2

	result.set(box.config, offset)

	return result
}

