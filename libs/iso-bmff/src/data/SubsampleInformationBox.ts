import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.7.7 Sub-Sample Information Box
 */
export type Subsample = {
	subsampleSize: number
	subsamplePriority: number
	discardable: number
	codecSpecificParameters: number
}

export type SubsampleEntry = {
	sampleDelta: number
	subsampleCount: number
	subsamples: Subsample[]
}

export class SubsampleInformationBox extends FullBox {
	entryCount: number
	entries: SubsampleEntry[]

	constructor(version: number, flags: number, entryCount: number, entries: SubsampleEntry[] = []) {
		super('subs', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + sum of entry sizes
		let size = 16

		for (const entry of this.entries) {
			size += 4 + 2 // sampleDelta + subsampleCount
			size += entry.subsamples.length * 4 // each subsample: 2 + 1 + 1 = 4 bytes
		}

		return size
	}
}

