import type { Fields } from '../boxes/Fields.ts'
import type { TrackEncryptionBox } from '../boxes/TrackEncryptionBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a TrackEncryptionBox to a Uint8Array.
 *
 * ISO/IEC 23001-7 - 8.2 Track Encryption Box
 *
 * @param box - The TrackEncryptionBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeTenc(box: Fields<TrackEncryptionBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const defaultIsEncryptedSize = 3
	const defaultIvSizeSize = 1
	const defaultKidSize = 16
	const totalSize = headerSize + fullBoxSize + defaultIsEncryptedSize + defaultIvSizeSize + defaultKidSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'tenc', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 3, box.defaultIsEncrypted)
	offset += 3

	writeUint(dataView, offset, 1, box.defaultIvSize)
	offset += 1

	for (let i = 0; i < 16; i++) {
		writeUint(dataView, offset, 1, box.defaultKid[i] ?? 0)
		offset += 1
	}

	return new Uint8Array(buffer)
}

