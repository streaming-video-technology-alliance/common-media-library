import type { HintMediaHeaderBox } from '../boxes/HintMediaHeaderBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.5 Hint Media Header Box
 */
export class hmhd extends FullBoxBase<HintMediaHeaderBox> {
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
		return new hmhd(maxPDUsize, avgPDUsize, maxbitrate, avgbitrate, version, flags)
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
		maxPDUsize: number,
		avgPDUsize: number,
		maxbitrate: number,
		avgbitrate: number,
		version?: number,
		flags?: number
	) {
		super('hmhd', version, flags)
		this.maxPDUsize = maxPDUsize
		this.avgPDUsize = avgPDUsize
		this.maxbitrate = maxbitrate
		this.avgbitrate = avgbitrate
	}

	override get size(): number {
		// 2 + 2 + 4 + 4
		return 12
	}
}
