import type { SubsampleEncryption } from './SubsampleEncryption.ts'

/**
 * Encrypted Sample
 *
 * @public
 */
export type EncryptedSample = {
	initializationVector?: Uint8Array;
	subsampleEncryption?: SubsampleEncryption[];
};
