import { CENC } from './CENC';
import { KEYIDS } from './KEYIDS';
import { WEBM } from './WEBM';

/**
 * Initialization Data Type.
 *
 * @group DRM
 *
 * @beta
 */
export const INITIALIZATION_DATA_TYPE = {
	CENC: CENC as typeof CENC,
	KEYIDS: KEYIDS as typeof KEYIDS,
	WEBM: WEBM as typeof WEBM,
} as const;


