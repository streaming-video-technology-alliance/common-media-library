import type { ValueOf } from '@svta/cml-utils'

/**
 * SVTA 99 [Custom] 000: Unknown custom error
 *
 * @public
 */
export const SVTA_CUSTOM_UNKNOWN = 99000 as const

/**
 * SVTA standardized error code in the Custom category (99xxx): the
 * category reserved for Publisher-defined errors. Codes 99001 through
 * 99999 are available for bespoke Publisher use.
 *
 * @see {@link https://www.svta.org/product/svta2070/ | SVTA2070: Standardized Error Codes}
 *
 * @enum
 *
 * @public
 */
export const SvtaCustomErrorCode = {
	/**
	 * Unknown custom error
	 */
	UNKNOWN: SVTA_CUSTOM_UNKNOWN as typeof SVTA_CUSTOM_UNKNOWN,
} as const

/**
 * Union type of all {@link (SvtaCustomErrorCode:variable)} values.
 *
 * @public
 */
export type SvtaCustomErrorCode = ValueOf<typeof SvtaCustomErrorCode>
