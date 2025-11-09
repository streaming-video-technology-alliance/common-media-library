import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.4 Null Media Header Box
 */
export class NullMediaHeaderBox extends FullBox {
	constructor(version: number, flags: number) {
		super('nmhd', version, flags)
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox)
		return 12
	}
}

