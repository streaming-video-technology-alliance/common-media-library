import type { ExtendedLanguageBox } from '../boxes/ExtendedLanguageBox.ts'
import type { Fields } from '../boxes/Fields.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'

/**
 * Write an ExtendedLanguageBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.4.6 Extended Language Tag
 *
 * @param box - The ExtendedLanguageBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeElng(box: Fields<ExtendedLanguageBox>): Uint8Array {
	const encoder = new TextEncoder()
	const extendedLanguageBytes = encoder.encode(box.extendedLanguage)

	const headerSize = 8
	const fullBoxSize = 4
	const extendedLanguageSize = extendedLanguageBytes.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + extendedLanguageSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'elng', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	result.set(extendedLanguageBytes, offset)
	offset += extendedLanguageBytes.length
	dataView.setUint8(offset, 0) // null terminator

	return result
}

