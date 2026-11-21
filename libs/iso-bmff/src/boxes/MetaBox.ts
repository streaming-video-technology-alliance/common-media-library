import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Meta Box (`meta`).
 *
 * ISO/IEC 14496-12:2015 - 8.11.1
 *
 * @public
 */
export type MetaBox<V extends IsoInt64 = number> = FullBox & {
	type: 'meta'
	boxes: ParsedIsoBox<V>[]
}
