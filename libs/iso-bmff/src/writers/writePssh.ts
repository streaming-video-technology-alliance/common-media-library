import type { Fields } from '../boxes/Fields.ts'
import type { ProtectionSystemSpecificHeaderBox } from '../boxes/ProtectionSystemSpecificHeaderBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a ProtectionSystemSpecificHeaderBox to a Uint8Array.
 *
 * ISO/IEC 23001-7 - 8.1 Protection System Specific Header Box
 *
 * @param box - The ProtectionSystemSpecificHeaderBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writePssh(box: Fields<ProtectionSystemSpecificHeaderBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const systemIdSize = 16
	const kidCountSize = box.version > 0 ? 4 : 0
	const kidSize = box.version > 0 ? box.kidCount * 16 : 0
	const dataSizeField = 4
	const dataSize = box.dataSize
	const totalSize = headerSize + fullBoxSize + systemIdSize + kidCountSize + kidSize + dataSizeField + dataSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'pssh', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	for (let i = 0; i < 16; i++) {
		writeUint(dataView, offset, 1, box.systemId[i] ?? 0)
		offset += 1
	}

	if (box.version > 0) {
		writeUint(dataView, offset, 4, box.kidCount)
		offset += 4

		for (let i = 0; i < box.kidCount; i++) {
			writeUint(dataView, offset, 1, box.kid[i] ?? 0)
			offset += 1
		}
	}

	writeUint(dataView, offset, 4, box.dataSize)
	offset += 4

	for (let i = 0; i < box.dataSize; i++) {
		writeUint(dataView, offset, 1, box.data[i] ?? 0)
		offset += 1
	}

	return new Uint8Array(buffer)
}

