import type { Fields } from '../boxes/Fields.js';
import type { ProducerReferenceTimeBox } from '../boxes/ProducerReferenceTimeBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a ProducerReferenceTimeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed ProducerReferenceTimeBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function prft(view: IsoView): Fields<ProducerReferenceTimeBox> {
	const { version, flags } = view.readFullBox();

	return {
		version,
		flags,
		referenceTrackId: view.readUint(4),
		ntpTimestampSec: view.readUint(4),
		ntpTimestampFrac: view.readUint(4),
		mediaTime: view.readUint(version === 1 ? 8 : 4),
	};
};
