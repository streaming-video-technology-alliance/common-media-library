import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
 */
export type TrackFragmentRandomAccessEntry = {
	time: number
	moofOffset: number
	trafNumber: number
	trunNumber: number
	sampleNumber: number
}

export class TrackFragmentRandomAccessBox extends FullBox {
	trackId: number
	reserved: number
	numberOfEntry: number
	lengthSizeOfTrafNum: number
	lengthSizeOfTrunNum: number
	lengthSizeOfSampleNum: number
	entries: TrackFragmentRandomAccessEntry[]

	constructor(
		version: number,
		flags: number,
		trackId: number,
		reserved: number,
		numberOfEntry: number,
		lengthSizeOfTrafNum: number,
		lengthSizeOfTrunNum: number,
		lengthSizeOfSampleNum: number,
		entries: TrackFragmentRandomAccessEntry[] = []
	) {
		super('tfra', version, flags)
		this.trackId = trackId
		this.reserved = reserved
		this.numberOfEntry = numberOfEntry
		this.lengthSizeOfTrafNum = lengthSizeOfTrafNum
		this.lengthSizeOfTrunNum = lengthSizeOfTrunNum
		this.lengthSizeOfSampleNum = lengthSizeOfSampleNum
		this.entries = entries
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 + 4 + 4 + 1 + 1 + 1 + entries
		const entrySize = this.lengthSizeOfTrafNum + this.lengthSizeOfTrunNum + this.lengthSizeOfSampleNum + 12
		return 27 + (this.entries.length * entrySize)
	}
}

