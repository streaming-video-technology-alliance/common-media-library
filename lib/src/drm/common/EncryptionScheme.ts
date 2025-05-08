import type { ValueOf } from '../../utils/ValueOf.ts';
import { CBCS } from './CBCS.ts';
import { CENC } from './CENC.ts';

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
