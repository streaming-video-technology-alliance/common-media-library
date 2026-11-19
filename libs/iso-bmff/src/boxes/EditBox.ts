import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Edit Box (`edts`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.5
 *
 * @public
 */
export type EditBox<V extends IsoInt64 = number> = {
	type: 'edts'
	boxes: ParsedIsoBox<V>[]
}
