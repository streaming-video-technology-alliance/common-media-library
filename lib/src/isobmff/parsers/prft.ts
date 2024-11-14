import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

export type ProducerReferenceTimeBox = FullBox & {
	referenceTrackId: number;
	ntpTimestampSec: number;
	ntpTimestampFrac: number;
	mediaTime: number;
};

// ISO/IEC 14496-12:2012 - 8.16.5 Producer Reference Time
export function prft(view: IsoView): ProducerReferenceTimeBox {
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
