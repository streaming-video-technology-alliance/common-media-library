import { CENC } from './CENC';
import { CBCS } from './CBCS';

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
