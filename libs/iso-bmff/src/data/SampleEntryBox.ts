import type { Box } from '../boxes/Box.ts'
import type { BoxType } from '../boxes/BoxType.ts'
import { BoxBase } from './BoxBase.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.5.2.2 Sample Entry
 */
export class SampleEntryBox extends BoxBase<Box<BoxType>> {
	reserved1: number[]
	dataReferenceIndex: number

	constructor(type: BoxType, reserved1: number[], dataReferenceIndex: number) {
		super(type)
		this.reserved1 = reserved1
		this.dataReferenceIndex = dataReferenceIndex
	}

	override get size(): number {
		// (reserved1.length * 1) + 2 (dataReferenceIndex)
		return 2 + this.reserved1.length
	}
}
