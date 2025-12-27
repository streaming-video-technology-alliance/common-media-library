import type { Fields } from '../boxes/types/Fields.ts'
import type { TrackEncryptionBox } from '../boxes/types/TrackEncryptionBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a TrackEncryptionBox to an IsoDataWriter.
 *
 * ISO/IEC 23001-7 - 8.2 Track Encryption Box
 *
 * @param box - The TrackEncryptionBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeTenc(box: Fields<TrackEncryptionBox>): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const defaultIsEncryptedSize = 3
	const defaultIvSizeSize = 1
	const defaultKidSize = 16
	const totalSize = headerSize + fullBoxSize + defaultIsEncryptedSize + defaultIvSizeSize + defaultKidSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('tenc', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.defaultIsEncrypted, 3)
	writer.writeUint(box.defaultIvSize, 1)

	for (let i = 0; i < 16; i++) {
		writer.writeUint(box.defaultKid[i] ?? 0, 1)
	}

	return writer
}
