import type { ValueOf } from '@svta/cml-utils'

/**
 * SVTA 0 [Unknown] 999: Unknown error
 *
 * @public
 */
export const SVTA_UNKNOWN = 999 as const

/**
 * SVTA standardized error code in the Unknown category: the error is
 * entirely unclassified. `999` is the only code below 1000, so fully
 * unknown errors can be filtered by returning codes less than 1000.
 *
 * @see {@link https://www.svta.org/product/svta2070/ | SVTA2070: Standardized Error Codes}
 *
 * @enum
 *
 * @public
 */
export const SvtaUnknownErrorCode = {
	/**
	 * Unknown error
	 */
	UNKNOWN: SVTA_UNKNOWN as typeof SVTA_UNKNOWN,
} as const

/**
 * Union type of all {@link (SvtaUnknownErrorCode:variable)} values.
 *
 * @public
 */
export type SvtaUnknownErrorCode = ValueOf<typeof SvtaUnknownErrorCode>
