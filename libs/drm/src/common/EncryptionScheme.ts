import type { ValueOf } from '@svta/cml-utils'
import { CBCS } from './CBCS.ts'
import { CENC } from './CENC.ts'

/**
 * Encryption schemes.
 *
 * @public
 */
export const EncryptionScheme = {
	CENC: CENC as typeof CENC,
	CBCS: CBCS as typeof CBCS,
} as const

/**
 * Encryption schemes.
 *
 * @public
 */
export type EncryptionScheme = ValueOf<typeof EncryptionScheme>;
