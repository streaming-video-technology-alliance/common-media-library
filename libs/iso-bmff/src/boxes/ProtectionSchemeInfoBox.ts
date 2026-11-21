import type { IsoInt64 } from '../IsoInt64.ts'
import type { ParsedIsoBox } from '../ParsedIsoBox.ts'

/**
 * Protection Scheme Information Box (`sinf`).
 *
 * ISO/IEC 14496-12:2015 - 8.12.1
 *
 * @public
 */
export type ProtectionSchemeInfoBox<V extends IsoInt64 = number> = {
	type: 'sinf'
	boxes: ParsedIsoBox<V>[]
}
