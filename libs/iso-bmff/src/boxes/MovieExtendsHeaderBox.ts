import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Movie Extends Header Box (`mehd`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.2
 *
 * @public
 */
export type MovieExtendsHeaderBox<V extends IsoInt64 = number> = FullBox & {
	type: 'mehd'
	/** The duration of the whole presentation with all fragments, in units of the `timescale` of the `mvhd` box. */
	fragmentDuration: V
}
