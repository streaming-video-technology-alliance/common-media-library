import type { ProducerReferenceTimeBox } from '../boxes/ProducerReferenceTimeBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `ProducerReferenceTimeBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `ProducerReferenceTimeBox`
 *
 * @public
 */
export function readPrft(view: IsoBoxReadView): ProducerReferenceTimeBox {
	const { version, flags } = view.readFullBox()

	return {
		type: 'prft',
		version,
		flags,
		referenceTrackId: view.readUint(4),
		ntpTimestampSec: view.readUint(4),
		ntpTimestampFrac: view.readUint(4),
		mediaTime: view.readUint(version === 1 ? 8 : 4),
	}
};
