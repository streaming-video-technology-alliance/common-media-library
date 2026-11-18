import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `smhd` box (`SoundMediaHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 12.2.2
 *
 * @param box - The `SoundMediaHeaderBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @example
 * {@includeCode ../../test/writers/writeSmhd.test.ts#example}
 *
 * @public
 */
export function writeSmhd(box: SoundMediaHeaderBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const balanceSize = 2
	const reservedSize = 2
	const totalSize = headerSize + fullBoxSize + balanceSize + reservedSize

	const writer = new IsoBoxWriteView('smhd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeTemplate(box.balance, 2)
	writer.writeUint(0, 2)

	return writer
}
