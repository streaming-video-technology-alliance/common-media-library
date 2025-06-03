import type { ValueOf } from '../../utils/ValueOf.js';
import { CBCS } from './CBCS.js';
import { CENC } from './CENC.js';

/**
 * Encryption schemes.
 *
 * @group DRM
 *
 * @beta
 */
export const EncryptionScheme = {
	CENC: CENC as typeof CENC,
	CBCS: CBCS as typeof CBCS,
} as const;

/**
 * Encryption schemes.
 *
 * @group DRM
 *
 * @beta
 */
export type EncryptionScheme = ValueOf<typeof EncryptionScheme>;
