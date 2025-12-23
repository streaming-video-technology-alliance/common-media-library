import type { Fields } from '../boxes/Fields.ts'
import type { HandlerReferenceBox } from '../boxes/HandlerReferenceBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeString } from './writeString.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a HandlerReferenceBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
 *
 * @param box - The HandlerReferenceBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeHdlr(box: Fields<HandlerReferenceBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const preDefinedSize = 4
	const handlerTypeSize = 4
	const reservedSize = 12 // 3 x 4 bytes
	const nameSize = box.name.length + 1 // null-terminated string
	const totalSize = headerSize + fullBoxSize + preDefinedSize + handlerTypeSize + reservedSize + nameSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'hdlr', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.preDefined)
	offset += preDefinedSize

	writeString(dataView, offset, box.handlerType)
	offset += handlerTypeSize

	for (let i = 0; i < 3; i++) {
		writeUint(dataView, offset, 4, box.reserved[i] ?? 0)
		offset += 4
	}

	writeString(dataView, offset, box.name)
	offset += box.name.length
	dataView.setUint8(offset, 0) // null terminator

	return new Uint8Array(buffer)
}

