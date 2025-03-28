import { CBCS } from './CBCS.js';
import { CENC } from './CENC.js';

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
