import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Sub Track Definition Box (`strd`).
 *
 * ISO/IEC 14496-12:2015 - 8.14.5
 *
 * @public
 */
export type SubTrackDefinition<V extends IsoInt64 = number> = {
	type: 'strd'
	boxes: ParsedIsoBox<V>[]
}
