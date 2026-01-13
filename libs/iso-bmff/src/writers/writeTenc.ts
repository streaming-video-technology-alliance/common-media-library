import type { TrackEncryptionBox } from '../boxes/TrackEncryptionBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `TrackEncryptionBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 23001-7 - 8.2 Track Encryption Box
 *
 * @param box - The `TrackEncryptionBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeTenc(box: TrackEncryptionBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const defaultIsEncryptedSize = 3
	const defaultIvSizeSize = 1
	const defaultKidSize = 16
	const totalSize = headerSize + fullBoxSize + defaultIsEncryptedSize + defaultIvSizeSize + defaultKidSize

	const writer = new IsoBoxWriteView('tenc', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.defaultIsEncrypted, 3)
	writer.writeUint(box.defaultIvSize, 1)
	writer.writeArray(box.defaultKid, UINT, 1, 16)

	return writer
}
