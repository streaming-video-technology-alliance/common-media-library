import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Restricted Scheme Information Box (`rinf`).
 *
 * ISO/IEC 14496-12:2015 - 8.15.3
 *
 * @public
 */
export type RestrictedSchemeInfoBox<V extends IsoInt64 = number> = {
	type: 'rinf'
	boxes: ParsedIsoBox<V>[]
}
