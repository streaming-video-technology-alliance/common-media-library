import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeInt } from '../writers/writeInt.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.3 Sound Media Header Box
 */
export class SoundMediaHeaderBox extends FullBox {
	static readonly type = 'smhd'

	/**
	 * Reads a SoundMediaHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.3 Sound Media Header Box
	 */
	static read(view: IsoView): SoundMediaHeaderBox {
		const { version, flags } = view.readFullBox()
		const balance = view.readUint(2)
		const reserved = view.readUint(2)
		return new SoundMediaHeaderBox(version, flags, balance, reserved)
	}

	/**
	 * Writes a SoundMediaHeaderBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.3 Sound Media Header Box
	 */
	static write(box: SoundMediaHeaderBox, dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box header
		writeUint(dataView, cursor, 4, box.size)
		cursor += 4
		writeString(dataView, cursor, 4, box.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(box, dataView, cursor)
		cursor += 4

		// Write balance (2 bytes, signed)
		writeInt(dataView, cursor, 2, box.balance)
		cursor += 2

		// Write reserved (2 bytes)
		writeUint(dataView, cursor, 2, box.reserved)
		cursor += 2

		return cursor - bufferOffset
	}

	balance: number
	reserved: number

	constructor(version: number, flags: number, balance: number, reserved: number) {
		super('smhd', version, flags)
		this.balance = balance
		this.reserved = reserved
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 2 (balance) + 2 (reserved)
		return 16
	}
}
