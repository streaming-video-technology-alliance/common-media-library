import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.3.1 Compact Sample Size Box
 */
export class CompactSampleSizeBox extends FullBox {
	static readonly type = 'stz2'

	fieldSize: number
	sampleCount: number
	entrySize: number[]

	constructor(version: number, flags: number, fieldSize: number, sampleCount: number, entrySize: number[] = []) {
		super('stz2', version, flags)
		this.fieldSize = fieldSize
		this.sampleCount = sampleCount
		this.entrySize = entrySize
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 1 (fieldSize) + 3 (reserved) + 4 (sampleCount) + (entrySize.length * fieldSize bytes)
		const fieldSizeBytes = this.fieldSize === 4 ? 1 : this.fieldSize === 8 ? 1 : this.fieldSize === 16 ? 2 : 0
		return 20 + (this.entrySize.length * fieldSizeBytes)
	}
}
