import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readSmhd } from '../readers/readSmhd.ts'
import { writeSmhd } from '../writers/writeSmhd.ts'
import type { Fields } from './types/Fields.ts'
import type { SoundMediaHeaderBox } from './types/SoundMediaHeaderBox.ts'

/**
 * SoundMediaHeader Box
 *
 * @public
 */
export class smhd implements Fields<SoundMediaHeaderBox> {
	/**
	 * Write a SoundMediaHeaderBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<SoundMediaHeaderBox>): IsoBoxWriteView {
		return writeSmhd(fields)
	}

	/**
	 * Read a SoundMediaHeaderBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed SoundMediaHeaderBox
	 */
	static read(view: IsoBoxReadView): Fields<SoundMediaHeaderBox> {
		return readSmhd(view)
	}

	balance: number
	flags: number
	reserved: number
	version: number

	/**
	 * Create a new SoundMediaHeaderBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param balance - The balance
	 * @param reserved - The reserved
	 */
	constructor(version: number, flags: number, balance: number, reserved: number) {
		this.version = version
		this.flags = flags
		this.balance = balance
		this.reserved = reserved
	}
}
