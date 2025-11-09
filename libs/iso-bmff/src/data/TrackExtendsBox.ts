import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
 */
export class TrackExtendsBox extends FullBox {
	trackId: number
	defaultSampleDescriptionIndex: number
	defaultSampleDuration: number
	defaultSampleSize: number
	defaultSampleFlags: number

	constructor(
		version: number,
		flags: number,
		trackId: number,
		defaultSampleDescriptionIndex: number,
		defaultSampleDuration: number,
		defaultSampleSize: number,
		defaultSampleFlags: number
	) {
		super('trex', version, flags)
		this.trackId = trackId
		this.defaultSampleDescriptionIndex = defaultSampleDescriptionIndex
		this.defaultSampleDuration = defaultSampleDuration
		this.defaultSampleSize = defaultSampleSize
		this.defaultSampleFlags = defaultSampleFlags
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 + 4 + 4 + 4 + 4
		return 32
	}
}
