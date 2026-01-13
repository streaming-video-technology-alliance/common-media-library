import type { ValueOf } from '@svta/cml-utils'

/**
 * CMAF-HAM CENC Protection Scheme
 *
 * @alpha
 */
export const CENC = 'cenc' as const

/**
 * CMAF-HAM CBCS Protection Scheme
 *
 * @alpha
 */
export const CBCS = 'cbcs' as const

/**
 * CMAF-HAM Protection Scheme type
 *
 * @alpha
 */
// TODO: Should this be moved to the DRM library?
export const ProtectionScheme = {
	CENC: CENC as typeof CENC,
	CBCS: CBCS as typeof CBCS,
} as const

/**
 * CMAF-HAM Protection Scheme type
 *
 * @alpha
 */
export type ProtectionScheme = ValueOf<typeof ProtectionScheme>;
