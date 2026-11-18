import type { TrackEncryptionBox } from '../boxes/TrackEncryptionBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `tenc` box (`TrackEncryptionBox`).
 *
 * ISO/IEC 23001-7:2016 - 8.2
 *
 * @param box - The `TrackEncryptionBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @example
 * {@includeCode ../../test/writers/writeTenc.test.ts#example}
 *
 * @public
 */
export function writeTenc(box: TrackEncryptionBox): IsoBoxWriteView {
	const { version, defaultConstantIv } = box
	const defaultConstantIvSize = box.defaultConstantIvSize ?? defaultConstantIv?.length
	const headerSize = 8
	const fullBoxSize = 4
	const protectionFieldsSize = 3
	const defaultIvSizeSize = 1
	const defaultKidSize = 16
	const constantIvSize = defaultConstantIvSize === undefined ? 0 : 1 + defaultConstantIvSize
	const totalSize =
		headerSize +
		fullBoxSize +
		protectionFieldsSize +
		defaultIvSizeSize +
		defaultKidSize +
		constantIvSize

	const writer = new IsoBoxWriteView('tenc', totalSize)
	writer.writeFullBox(version, box.flags)

	writer.writeUint(0, 1)
	writer.writeUint(
		version > 0
			? (((box.defaultCryptByteBlock ?? 0) & 0xf) << 4) | ((box.defaultSkipByteBlock ?? 0) & 0xf)
			: 0,
		1,
	)
	writer.writeUint(box.defaultIsProtected, 1)
	writer.writeUint(box.defaultPerSampleIvSize, 1)
	writer.writeArray(box.defaultKid, UINT, 1, 16)

	if (defaultConstantIvSize !== undefined) {
		writer.writeUint(defaultConstantIvSize, 1)
		writer.writeArray(defaultConstantIv ?? [], UINT, 1, defaultConstantIvSize)
	}

	return writer
}
