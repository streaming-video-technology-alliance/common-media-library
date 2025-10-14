import type { SubsampleEncryption } from './SubsampleEncryption.ts';

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
