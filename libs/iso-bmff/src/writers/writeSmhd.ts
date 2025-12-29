import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a SoundMediaHeaderBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 12.2.2 Sound Media Header Box
 *
 * @param box - The SoundMediaHeaderBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeSmhd(box: SoundMediaHeaderBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const balanceSize = 2
	const reservedSize = 2
	const totalSize = headerSize + fullBoxSize + balanceSize + reservedSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('smhd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.balance, 2)
	writer.writeUint(box.reserved, 2)

	return writer
}
