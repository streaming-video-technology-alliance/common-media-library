import type { EncryptedSample } from './EncryptedSample.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Sample Encryption Box - 'senc'
 *
 * @public
 */
export type SampleEncryptionBox = FullBox & {
	type: 'senc';
	sampleCount: number;
	samples: EncryptedSample[];
};
