import type { ValueOf } from '@svta/cml-utils'
import { CBCS } from './CBCS.ts'
import { CENC } from './CENC.ts'
import { KEYIDS } from './KEYIDS.ts'
import { WEBM } from './WEBM.ts'

/**
 * Initialization Data Type.
 *
 * @public
 */
export const InitializationDataType = {
	CENC: CENC as typeof CENC,
	CBCS: CBCS as typeof CBCS,
	KEYIDS: KEYIDS as typeof KEYIDS,
	WEBM: WEBM as typeof WEBM,
} as const

/**
 * Initialization Data Type.
 *
 * @public
 */
export type InitializationDataType = ValueOf<typeof InitializationDataType>;
