import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.4.1 Sample Dependency Type box
 */
export class SampleDependencyTypeBox extends FullBox {
	sampleDependencyTable: number[]

	constructor(version: number, flags: number, sampleDependencyTable: number[] = []) {
		super('sdtp', version, flags)
		this.sampleDependencyTable = sampleDependencyTable
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + (sampleDependencyTable.length * 1)
		return 12 + this.sampleDependencyTable.length
	}
}

