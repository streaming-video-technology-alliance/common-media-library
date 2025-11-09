import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
 */
export class MovieFragmentHeaderBox extends FullBox {
	sequenceNumber: number

	constructor(version: number, flags: number, sequenceNumber: number) {
		super('mfhd', version, flags)
		this.sequenceNumber = sequenceNumber
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (sequenceNumber)
		return 16
	}
}

