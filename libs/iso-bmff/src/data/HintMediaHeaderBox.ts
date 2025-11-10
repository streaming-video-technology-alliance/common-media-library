import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.5 Hint Media Header Box
 */
export class HintMediaHeaderBox extends FullBox {
	static readonly type = 'hmhd'
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
