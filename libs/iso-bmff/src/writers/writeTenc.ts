import type { TrackEncryptionBox } from '../boxes/TrackEncryptionBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `TrackEncryptionBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 23001-7:2016 - 8.2 Track Encryption Box
 *
 * @param box - The `TrackEncryptionBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @example
 * {@includeCode ../../test/writers/writeTenc.test.ts#example}
 *
 * @public
 */
export function writeTenc(box: TrackEncryptionBox): IsoBoxWriteView {
	const { version, defaultIsEncrypted, defaultConstantIv } = box
	const defaultConstantIvSize = box.defaultConstantIvSize ?? defaultConstantIv?.length
	const headerSize = 8
	const fullBoxSize = 4
	const defaultIsEncryptedSize = 3
	const defaultIvSizeSize = 1
	const defaultKidSize = 16
	const constantIvSize = defaultConstantIvSize === undefined ? 0 : 1 + defaultConstantIvSize
	const totalSize =
		headerSize +
		fullBoxSize +
		defaultIsEncryptedSize +
		defaultIvSizeSize +
		defaultKidSize +
		constantIvSize

	const writer = new IsoBoxWriteView('tenc', totalSize)
	writer.writeFullBox(version, box.flags)

	writer.writeUint(
		version > 0
			? (defaultIsEncrypted & 0xff00ff) |
					(((box.defaultCryptByteBlock ?? defaultIsEncrypted >> 12) & 0xf) << 12) |
					(((box.defaultSkipByteBlock ?? defaultIsEncrypted >> 8) & 0xf) << 8)
			: defaultIsEncrypted,
		3,
	)
	writer.writeUint(box.defaultIvSize, 1)
	writer.writeArray(box.defaultKid, UINT, 1, 16)

	if (defaultConstantIvSize !== undefined) {
		writer.writeUint(defaultConstantIvSize, 1)
		writer.writeArray(defaultConstantIv ?? [], UINT, 1, defaultConstantIvSize)
	}

	return writer
}
