import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Track Fragment Base Media Decode Time Box (`tfdt`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.12
 *
 * @public
 */
export type TrackFragmentBaseMediaDecodeTimeBox<V extends IsoInt64 = number> = FullBox & {
	type: 'tfdt'
	baseMediaDecodeTime: V
}
