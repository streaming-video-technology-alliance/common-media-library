import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.8 Track Run Box
 */
export type TrackRunSample = {
	sampleDuration?: number
	sampleSize?: number
	sampleFlags?: number
	sampleCompositionTimeOffset?: number
}

export class TrackRunBox extends FullBox {
	sampleCount: number
	dataOffset?: number
	firstSampleFlags?: number
	samples: TrackRunSample[]

	constructor(
		version: number,
		flags: number,
		sampleCount: number,
		samples: TrackRunSample[] = [],
		dataOffset?: number,
		firstSampleFlags?: number
	) {
		super('trun', version, flags)
		this.sampleCount = sampleCount
		this.dataOffset = dataOffset
		this.firstSampleFlags = firstSampleFlags
		this.samples = samples
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (sampleCount) + optional fields + samples
		let size = 16

		if (this.dataOffset !== undefined) size += 4
		if (this.firstSampleFlags !== undefined) size += 4

		// Calculate sample size based on flags
		for (const sample of this.samples) {
			if (sample.sampleDuration !== undefined) size += 4
			if (sample.sampleSize !== undefined) size += 4
			if (sample.sampleFlags !== undefined) size += 4
			if (sample.sampleCompositionTimeOffset !== undefined) size += 4
		}

		return size
	}
}

