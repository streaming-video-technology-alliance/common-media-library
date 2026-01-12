import type { ProducerReferenceTimeBox } from '../boxes/ProducerReferenceTimeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `ProducerReferenceTimeBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 14496-12:2012 - 8.16.5 Producer Reference Time Box
 *
 * @param box - The `ProducerReferenceTimeBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writePrft(box: ProducerReferenceTimeBox): IsoBoxWriteView {
	const v1 = box.version === 1
	const mediaTimeSize = v1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const referenceTrackIdSize = 4
	const ntpTimestampSecSize = 4
	const ntpTimestampFracSize = 4
	const totalSize = headerSize + fullBoxSize + referenceTrackIdSize +
		ntpTimestampSecSize + ntpTimestampFracSize + mediaTimeSize

	const writer = new IsoBoxWriteView('prft', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.referenceTrackId, 4)
	writer.writeUint(box.ntpTimestampSec, 4)
	writer.writeUint(box.ntpTimestampFrac, 4)
	writer.writeUint(box.mediaTime, mediaTimeSize)

	return writer
}
