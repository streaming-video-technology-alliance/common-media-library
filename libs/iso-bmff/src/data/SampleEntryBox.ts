import { Box } from './Box.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.5.2.2 Sample Entry
 */
export class SampleEntryBox extends Box {
	reserved1: number[]
	dataReferenceIndex: number

	constructor(type: `${string}${string}${string}${string}`, reserved1: number[], dataReferenceIndex: number) {
		super(type)
		this.reserved1 = reserved1
		this.dataReferenceIndex = dataReferenceIndex
	}

	override get size(): number {
		// 8 (box header) + (reserved1.length * 1) + 2 (dataReferenceIndex)
		return 10 + this.reserved1.length
	}
}
