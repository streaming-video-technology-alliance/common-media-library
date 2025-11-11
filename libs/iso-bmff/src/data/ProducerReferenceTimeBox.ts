import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.16.5 Producer Reference Time
 */
export class ProducerReferenceTimeBox extends FullBox {
	static readonly type = 'prft'

	/**
	 * Reads a ProducerReferenceTimeBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.5 Producer Reference Time
	 */
	static read(view: IsoView): ProducerReferenceTimeBox {
		const { version, flags } = view.readFullBox()
		const referenceTrackId = view.readUint(4)
		const ntpTimestampSec = view.readUint(4)
		const ntpTimestampFrac = view.readUint(4)
		const mediaTime = view.readUint(version === 1 ? 8 : 4)
		return new ProducerReferenceTimeBox(version, flags, referenceTrackId, ntpTimestampSec, ntpTimestampFrac, mediaTime)
	}

	/**
	 * Writes a ProducerReferenceTimeBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.5 Producer Reference Time
	 */
	static write(box: ProducerReferenceTimeBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.referenceTrackId, 4)
		view.writeUint(box.ntpTimestampSec, 4)
		view.writeUint(box.ntpTimestampFrac, 4)
		const timeSize = box.version === 1 ? 8 : 4
		view.writeUint(box.mediaTime, timeSize)
	}

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
