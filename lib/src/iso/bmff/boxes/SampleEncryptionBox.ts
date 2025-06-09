import type { EncryptedSample } from './EncryptedSample.js';
import type { FullBox } from './FullBox.js';

/**
 * Sample Encryption Box - 'senc'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SampleEncryptionBox = FullBox & {
	type: 'senc';
	sampleCount: number;
	samples: EncryptedSample[];
};
