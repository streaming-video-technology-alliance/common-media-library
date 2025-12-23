import type { Fields } from '../boxes/Fields.ts'
import type { TrackEncryptionBox } from '../boxes/TrackEncryptionBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a TrackEncryptionBox to an IsoDataWriter.
 *
 * ISO/IEC 23001-7 - 8.2 Track Encryption Box
 *
 * @param box - The TrackEncryptionBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeTenc(box: Fields<TrackEncryptionBox>): IsoDataWriter {
	const headerSize = 8
	const fullBoxSize = 4
	const defaultIsEncryptedSize = 3
	const defaultIvSizeSize = 1
	const defaultKidSize = 16
	const totalSize = headerSize + fullBoxSize + defaultIsEncryptedSize + defaultIvSizeSize + defaultKidSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('tenc', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.defaultIsEncrypted, 3)
	writer.writeUint(box.defaultIvSize, 1)

	for (let i = 0; i < 16; i++) {
		writer.writeUint(box.defaultKid[i] ?? 0, 1)
	}

	return writer
}
