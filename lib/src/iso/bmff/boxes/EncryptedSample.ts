import type { SubsampleEncryption } from './SubsampleEncryption.js';

/**
 * Encrypted Sample
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type EncryptedSample = {
	initializationVector?: Uint8Array;
	subsampleEncryption?: SubsampleEncryption[];
};
