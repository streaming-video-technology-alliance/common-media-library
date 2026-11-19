import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { ProducerReferenceTimeBox } from '../boxes/ProducerReferenceTimeBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `prft` box (`ProducerReferenceTimeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.16.5
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `ProducerReferenceTimeBox` fields to write
 *
 * @public
 */
export function writePrft(
	cursor: IsoBoxWriteCursor,
	box: ProducerReferenceTimeBox<IsoInt64>,
): void {
	const mediaTimeSize = box.version === 0 ? 4 : 8
	const headerSize = 8
	const fullBoxSize = 4
	const referenceTrackIdSize = 4
	const ntpTimestampSecSize = 4
	const ntpTimestampFracSize = 4
	const totalSize =
		headerSize +
		fullBoxSize +
		referenceTrackIdSize +
		ntpTimestampSecSize +
		ntpTimestampFracSize +
		mediaTimeSize

	const writer = new IsoBoxWriteView('prft', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.referenceTrackId, 4)
	writer.writeUint(box.ntpTimestampSec, 4)
	writer.writeUint(box.ntpTimestampFrac, 4)
	writer.writeWideUint(box.mediaTime, mediaTimeSize)

	writeLegacyView(cursor, writer)
}
