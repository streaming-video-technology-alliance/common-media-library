import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.7 Track Fragment Header Box
 */
export class TrackFragmentHeaderBox extends FullBox {
	static readonly type = 'tfhd'
	trackId: number
	baseDataOffset?: number
	sampleDescriptionIndex?: number
	defaultSampleDuration?: number
	defaultSampleSize?: number
	defaultSampleFlags?: number

	constructor(
		version: number,
		flags: number,
		trackId: number,
		baseDataOffset?: number,
		sampleDescriptionIndex?: number,
		defaultSampleDuration?: number,
		defaultSampleSize?: number,
		defaultSampleFlags?: number
	) {
		super('tfhd', version, flags)
		this.trackId = trackId
		this.baseDataOffset = baseDataOffset
		this.sampleDescriptionIndex = sampleDescriptionIndex
		this.defaultSampleDuration = defaultSampleDuration
		this.defaultSampleSize = defaultSampleSize
		this.defaultSampleFlags = defaultSampleFlags
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (trackId) + optional fields based on flags
		let size = 16

		if (this.baseDataOffset !== undefined) size += 8
		if (this.sampleDescriptionIndex !== undefined) size += 4
		if (this.defaultSampleDuration !== undefined) size += 4
		if (this.defaultSampleSize !== undefined) size += 4
		if (this.defaultSampleFlags !== undefined) size += 4

		return size
	}
}
