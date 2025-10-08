import type { SubsampleEncryption } from './SubsampleEncryption.js';

/**
 * Encrypted Sample
 *
 *
 * @beta
 */
export type EncryptedSample = {
	initializationVector?: Uint8Array;
	subsampleEncryption?: SubsampleEncryption[];
};
