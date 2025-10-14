import type { Fields } from '../boxes/Fields.ts'
import type { ProducerReferenceTimeBox } from '../boxes/ProducerReferenceTimeBox.ts'
import type { IsoView } from '../IsoView.ts'

/**
 * Parse a ProducerReferenceTimeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed ProducerReferenceTimeBox
 *
 *
 * @beta
 */
export function prft(view: IsoView): Fields<ProducerReferenceTimeBox> {
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
