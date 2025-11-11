import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

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
	 * Writes a SoundMediaHeaderBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.3 Sound Media Header Box
	 */
	static write(box: SoundMediaHeaderBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeInt(box.balance, 2)
		view.writeUint(box.reserved, 2)
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
