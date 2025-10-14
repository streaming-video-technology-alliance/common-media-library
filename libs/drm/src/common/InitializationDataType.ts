import type { ValueOf } from '@svta/cml-utils';
import { CBCS } from './CBCS.js';
import { CENC } from './CENC.js';
import { KEYIDS } from './KEYIDS.js';
import { WEBM } from './WEBM.js';

/**
 * Initialization Data Type.
 *
 *
 * @beta
 */
export const InitializationDataType = {
	CENC: CENC as typeof CENC,
	CBCS: CBCS as typeof CBCS,
	KEYIDS: KEYIDS as typeof KEYIDS,
	WEBM: WEBM as typeof WEBM,
} as const;

/**
 * Initialization Data Type.
 *
 *
 * @beta
 */
export type InitializationDataType = ValueOf<typeof InitializationDataType>;
