import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
 */
export class MovieFragmentRandomAccessOffsetBox extends FullBox {
	static readonly type = 'mfro'

	mfraSize: number

	constructor(version: number, flags: number, mfraSize: number) {
		super('mfro', version, flags)
		this.mfraSize = mfraSize
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (mfraSize)
		return 16
	}
}
