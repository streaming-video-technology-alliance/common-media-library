import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.5 Hint Media Header Box
 */
export class HintMediaHeaderBox extends FullBox {
	static readonly type = 'hmhd'

	/**
	 * Reads a HintMediaHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.5 Hint Media Header Box
	 */
	static read(view: IsoView): HintMediaHeaderBox {
		const { version, flags } = view.readFullBox()
		const maxPDUsize = view.readUint(2)
		const avgPDUsize = view.readUint(2)
		const maxbitrate = view.readUint(4)
		const avgbitrate = view.readUint(4)
		return new HintMediaHeaderBox(version, flags, maxPDUsize, avgPDUsize, maxbitrate, avgbitrate)
	}

	/**
	 * Writes a HintMediaHeaderBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.5 Hint Media Header Box
	 */
	static write(box: HintMediaHeaderBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.maxPDUsize, 2)
		view.writeUint(box.avgPDUsize, 2)
		view.writeUint(box.maxbitrate, 4)
		view.writeUint(box.avgbitrate, 4)
	}

	maxPDUsize: number
	avgPDUsize: number
	maxbitrate: number
	avgbitrate: number

	constructor(
		version: number,
		flags: number,
		maxPDUsize: number,
		avgPDUsize: number,
		maxbitrate: number,
		avgbitrate: number
	) {
		super('hmhd', version, flags)
		this.maxPDUsize = maxPDUsize
		this.avgPDUsize = avgPDUsize
		this.maxbitrate = maxbitrate
		this.avgbitrate = avgbitrate
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 2 + 2 + 4 + 4
		return 24
	}
}
