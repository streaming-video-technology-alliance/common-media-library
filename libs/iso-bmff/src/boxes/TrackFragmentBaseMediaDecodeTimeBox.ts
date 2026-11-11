import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Decode Time
 *
 * @public
 */
export type TrackFragmentBaseMediaDecodeTimeBox<V extends IsoInt64 = number> = FullBox & {
	type: 'tfdt'
	baseMediaDecodeTime: V
}
