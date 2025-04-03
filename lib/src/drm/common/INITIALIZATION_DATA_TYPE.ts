import { CBCS } from './CBCS.js';
import { CENC } from './CENC.js';
import { KEYIDS } from './KEYIDS.js';
import { WEBM } from './WEBM.js';

/**
 * Initialization Data Type.
 *
 * @group DRM
 *
 * @beta
 */
export const INITIALIZATION_DATA_TYPE = {
	CENC: CENC as typeof CENC,
	CBCS: CBCS as typeof CBCS,
	KEYIDS: KEYIDS as typeof KEYIDS,
	WEBM: WEBM as typeof WEBM,
} as const;


