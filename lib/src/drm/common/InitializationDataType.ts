import type { ValueOf } from '../../utils/ValueOf.ts';
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
export const InitializationDataType = {
	CENC: CENC as typeof CENC,
	CBCS: CBCS as typeof CBCS,
	KEYIDS: KEYIDS as typeof KEYIDS,
	WEBM: WEBM as typeof WEBM,
} as const;

/**
 * Initialization Data Type.
 *
 * @group DRM
 *
 * @beta
 */
export type InitializationDataType = ValueOf<typeof InitializationDataType>;
