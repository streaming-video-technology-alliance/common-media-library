import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Media Box (`mdia`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.1
 *
 * @public
 */
export type MediaBox<V extends IsoInt64 = number> = {
	type: 'mdia'
	boxes: ParsedIsoBox<V>[]
}
