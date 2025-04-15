import { CBCS } from './CBCS.ts';
import { CENC } from './CENC.ts';
import { KEYIDS } from './KEYIDS.ts';
import { WEBM } from './WEBM.ts';

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


