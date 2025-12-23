import type { Fields } from '../boxes/Fields.ts'
import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a SoundMediaHeaderBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 12.2.2 Sound Media Header Box
 *
 * @param box - The SoundMediaHeaderBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeSmhd(box: Fields<SoundMediaHeaderBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const balanceSize = 2
	const reservedSize = 2
	const totalSize = headerSize + fullBoxSize + balanceSize + reservedSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'smhd', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 2, box.balance)
	offset += 2

	writeUint(dataView, offset, 2, box.reserved)

	return new Uint8Array(buffer)
}

