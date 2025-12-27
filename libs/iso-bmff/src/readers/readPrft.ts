import type { Fields } from '../boxes/types/Fields.ts'
import type { ProducerReferenceTimeBox } from '../boxes/types/ProducerReferenceTimeBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a ProducerReferenceTimeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed ProducerReferenceTimeBox
 *
 * @public
 */
export function readPrft(view: IsoBoxReadView): Fields<ProducerReferenceTimeBox> {
	const { version, flags } = view.readFullBox()

	return {
		version,
		flags,
		referenceTrackId: view.readUint(4),
		ntpTimestampSec: view.readUint(4),
		ntpTimestampFrac: view.readUint(4),
		mediaTime: view.readUint(version === 1 ? 8 : 4),
	}
};
