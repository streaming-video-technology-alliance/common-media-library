import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.3 Sound Media Header Box
 */
export class smhd extends FullBoxBase<SoundMediaHeaderBox> {
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
		return new smhd(balance, reserved, version, flags)
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

	constructor(balance: number, reserved: number, version?: number, flags?: number) {
		super('smhd', version, flags)
		this.balance = balance
		this.reserved = reserved
	}

	override get size(): number {
		// 2 (balance) + 2 (reserved)
		return 4
	}
}
