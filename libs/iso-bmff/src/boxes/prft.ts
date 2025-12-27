import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readPrft } from '../readers/readPrft.ts'
import { writePrft } from '../writers/writePrft.ts'
import type { Fields } from './types/Fields.ts'
import type { ProducerReferenceTimeBox } from './types/ProducerReferenceTimeBox.ts'

/**
 * ProducerReferenceTime Box
 *
 * @public
 */
export class prft implements Fields<ProducerReferenceTimeBox> {
	/**
	 * Write a ProducerReferenceTimeBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<ProducerReferenceTimeBox>): IsoBoxWriteView {
		return writePrft(fields)
	}

	/**
	 * Read a ProducerReferenceTimeBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed ProducerReferenceTimeBox
	 */
	static read(view: IsoBoxReadView): Fields<ProducerReferenceTimeBox> {
		return readPrft(view)
	}

	flags: number
	mediaTime: number
	ntpTimestampFrac: number
	ntpTimestampSec: number
	referenceTrackId: number
	version: number

	/**
	 * Create a new ProducerReferenceTimeBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param mediaTime - The mediaTime
	 * @param ntpTimestampFrac - The ntpTimestampFrac
	 * @param ntpTimestampSec - The ntpTimestampSec
	 * @param referenceTrackId - The referenceTrackId
	 */
	constructor(version: number, flags: number, mediaTime: number, ntpTimestampFrac: number, ntpTimestampSec: number, referenceTrackId: number) {
		this.version = version
		this.flags = flags
		this.mediaTime = mediaTime
		this.ntpTimestampFrac = ntpTimestampFrac
		this.ntpTimestampSec = ntpTimestampSec
		this.referenceTrackId = referenceTrackId
	}
}
