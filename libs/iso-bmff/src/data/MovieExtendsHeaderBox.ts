import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
 */
export class MovieExtendsHeaderBox extends FullBox {
	static readonly type = 'mehd'
	fragmentDuration: number

	constructor(version: number, flags: number, fragmentDuration: number) {
		super('mehd', version, flags)
		this.fragmentDuration = fragmentDuration
	}

	override get size(): number {
		const durationSize = this.version === 1 ? 8 : 4
		// 8 (box header) + 4 (FullBox) + durationSize
		return 12 + durationSize
	}
}
