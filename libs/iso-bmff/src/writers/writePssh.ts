import type { Fields } from '../boxes/types/Fields.ts'
import type { ProtectionSystemSpecificHeaderBox } from '../boxes/types/ProtectionSystemSpecificHeaderBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a ProtectionSystemSpecificHeaderBox to an IsoDataWriter.
 *
 * ISO/IEC 23001-7 - 8.1 Protection System Specific Header Box
 *
 * @param box - The ProtectionSystemSpecificHeaderBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writePssh(box: Fields<ProtectionSystemSpecificHeaderBox>): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const systemIdSize = 16
	const kidCountSize = box.version > 0 ? 4 : 0
	const kidSize = box.version > 0 ? box.kidCount * 16 : 0
	const dataSizeField = 4
	const dataSize = box.dataSize
	const totalSize = headerSize + fullBoxSize + systemIdSize + kidCountSize + kidSize + dataSizeField + dataSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('pssh', totalSize)
	writer.writeFullBox(box.version, box.flags)

	for (let i = 0; i < 16; i++) {
		writer.writeUint(box.systemId[i] ?? 0, 1)
	}

	if (box.version > 0) {
		writer.writeUint(box.kidCount, 4)

		for (let i = 0; i < box.kidCount; i++) {
			writer.writeUint(box.kid[i] ?? 0, 1)
		}
	}

	writer.writeUint(box.dataSize, 4)

	for (let i = 0; i < box.dataSize; i++) {
		writer.writeUint(box.data[i] ?? 0, 1)
	}

	return writer
}
