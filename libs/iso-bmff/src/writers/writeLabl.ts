import type { Fields } from '../boxes/Fields.ts'
import type { LabelBox } from '../boxes/LabelBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a LabelBox to a Uint8Array.
 *
 * @param box - The LabelBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeLabl(box: Fields<LabelBox>): Uint8Array {
	const encoder = new TextEncoder()
	const languageBytes = encoder.encode(box.language)
	const labelBytes = encoder.encode(box.label)

	const headerSize = 8
	const fullBoxSize = 4
	const labelIdSize = 2
	const languageSize = languageBytes.length + 1 // null-terminated
	const labelSize = labelBytes.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + labelIdSize + languageSize + labelSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'labl', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 2, box.labelId)
	offset += 2

	result.set(languageBytes, offset)
	offset += languageBytes.length
	dataView.setUint8(offset, 0) // null terminator
	offset += 1

	result.set(labelBytes, offset)
	offset += labelBytes.length
	dataView.setUint8(offset, 0) // null terminator

	return result
}

