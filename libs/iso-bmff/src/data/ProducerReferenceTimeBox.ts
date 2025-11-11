import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

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
	 * Writes a ProducerReferenceTimeBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.5 Producer Reference Time
	 */
	static write(box: ProducerReferenceTimeBox, dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box header
		writeUint(dataView, cursor, 4, box.size)
		cursor += 4
		writeString(dataView, cursor, 4, box.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(box, dataView, cursor)
		cursor += 4

		// Write referenceTrackId (4 bytes)
		writeUint(dataView, cursor, 4, box.referenceTrackId)
		cursor += 4

		// Write ntpTimestampSec (4 bytes)
		writeUint(dataView, cursor, 4, box.ntpTimestampSec)
		cursor += 4

		// Write ntpTimestampFrac (4 bytes)
		writeUint(dataView, cursor, 4, box.ntpTimestampFrac)
		cursor += 4

		// Write mediaTime
		const timeSize = box.version === 1 ? 8 : 4
		writeUint(dataView, cursor, timeSize, box.mediaTime)
		cursor += timeSize

		return cursor - bufferOffset
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
