import type { ValueOf } from '@svta/cml-utils'

/**
 * CMAF-HAM Dynamic Manifest Type
 *
 * @alpha
 */
export const DYNAMIC = 'dynamic' as const

/**
 * CMAF-HAM Static Manifest Type
 *
 * @alpha
 */
export const STATIC = 'static' as const

/**
 * CMAF-HAM Static Manifest Type
 *
 * @alpha
 */
export const ManifestType = {
	DYNAMIC: DYNAMIC as typeof DYNAMIC,
	STATIC: STATIC as typeof STATIC,
} as const

/**
 * CMAF-HAM Manifest Type
 *
 * @alpha
 */
export type ManifestType = ValueOf<typeof ManifestType>;
