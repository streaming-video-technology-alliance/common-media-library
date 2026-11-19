import type { ProducerReferenceTimeBox } from '../boxes/ProducerReferenceTimeBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `prft` box (`ProducerReferenceTimeBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `ProducerReferenceTimeBox`
 *
 * @public
 */
export function readPrft<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): ProducerReferenceTimeBox<V> {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()

	return {
		type: 'prft',
		version,
		flags,
		referenceTrackId: view.readUint(4),
		ntpTimestampSec: view.readUint(4),
		ntpTimestampFrac: view.readUint(4),
		mediaTime: view.readWideUint(version === 0 ? 4 : 8),
	}
}
