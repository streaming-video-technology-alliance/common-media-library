import type { ProducerReferenceTimeBox } from '../boxes/ProducerReferenceTimeBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `ProducerReferenceTimeBox` from an `IsoBoxReadView`.
 *
 * The 64-bit integer fields of the result have the type that the `int64` option of the view returns.
 * With no option, they are numbers.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `ProducerReferenceTimeBox`
 *
 * @public
 */
export function readPrft<V extends IsoInt64>(view: IsoBoxReadView<V>): ProducerReferenceTimeBox<V> {
	const { version, flags } = view.readFullBox()

	return {
		type: 'prft',
		version,
		flags,
		referenceTrackId: view.readUint(4),
		ntpTimestampSec: view.readUint(4),
		ntpTimestampFrac: view.readUint(4),
		mediaTime: view.readWideUint(version === 1 ? 8 : 4),
	}
}
