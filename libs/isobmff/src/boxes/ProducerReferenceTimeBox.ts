import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.16.5 Producer Reference Time
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type ProducerReferenceTimeBox = FullBox & {
	type: 'prft';
	referenceTrackId: number;
	ntpTimestampSec: number;
	ntpTimestampFrac: number;
	mediaTime: number;
};
