import type { ProtectionSystemSpecificHeaderBox } from '../boxes/ProtectionSystemSpecificHeaderBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `ProtectionSystemSpecificHeaderBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 23001-7 - 8.1 Protection System Specific Header Box
 *
 * @param box - The `ProtectionSystemSpecificHeaderBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writePssh(box: ProtectionSystemSpecificHeaderBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const systemIdSize = 16
	const kidCountSize = box.version > 0 ? 4 : 0
	const kidSize = box.version > 0 ? box.kidCount * 16 : 0
	const dataSizeField = 4
	const dataSize = box.dataSize
	const totalSize = headerSize + fullBoxSize + systemIdSize + kidCountSize + kidSize + dataSizeField + dataSize

	const writer = new IsoBoxWriteView('pssh', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeArray(box.systemId, UINT, 1, 16)

	if (box.version > 0) {
		writer.writeUint(box.kidCount, 4)
		writer.writeArray(box.kid, UINT, 1, box.kidCount)
	}

	writer.writeUint(box.dataSize, 4)
	writer.writeArray(box.data, UINT, 1, box.dataSize)

	return writer
}
