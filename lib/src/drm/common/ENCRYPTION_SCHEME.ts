import { CENC } from './CENC.ts';
import { CBCS } from './CBCS.ts';

/**
 * Encryption schemes.
 *
 * @group DRM
 *
 * @beta
 */
export const ENCRYPTION_SCHEME = {
	CENC: CENC as typeof CENC,
	CBCS: CBCS as typeof CBCS,
} as const;
