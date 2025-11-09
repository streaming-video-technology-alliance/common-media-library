import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.4.5.6 Subtitle Media Header Box
 */
export class SubtitleMediaHeaderBox extends FullBox {
	constructor(version: number, flags: number) {
		super('sthd', version, flags)
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox)
		return 12
	}
}

