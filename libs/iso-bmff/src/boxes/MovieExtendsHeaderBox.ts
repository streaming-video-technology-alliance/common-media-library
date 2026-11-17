import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
 *
 * @public
 */
export type MovieExtendsHeaderBox<V extends IsoInt64 = number> = FullBox & {
	type: 'mehd'
	fragmentDuration: V
}
