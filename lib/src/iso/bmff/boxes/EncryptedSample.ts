import type { SubsampleEncryption } from './SubsampleEncryption.js';

export type EncryptedSample = {
	initializationVector?: Uint8Array;
	subsampleEncryption?: SubsampleEncryption[];
};
