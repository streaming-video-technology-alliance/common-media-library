import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.16.5 Producer Reference Time
 */
export class ProducerReferenceTimeBox extends FullBox {
	static readonly type = 'prft'
	referenceTrackId: number
	ntpTimestampSec: number
	ntpTimestampFrac: number
	mediaTime: number

	constructor(
		version: number,
		flags: number,
		referenceTrackId: number,
		ntpTimestampSec: number,
		ntpTimestampFrac: number,
		mediaTime: number
	) {
		super('prft', version, flags)
		this.referenceTrackId = referenceTrackId
		this.ntpTimestampSec = ntpTimestampSec
		this.ntpTimestampFrac = ntpTimestampFrac
		this.mediaTime = mediaTime
	}

	override get size(): number {
		const timeSize = this.version === 1 ? 8 : 4
		// 8 (box header) + 4 (FullBox) + 4 + 4 + 4 + timeSize
		return 24 + timeSize
	}
}
