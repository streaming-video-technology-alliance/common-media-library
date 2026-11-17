import type { IsoBox } from '../IsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Child boxes of Additional Metadata Container Box
 *
 * @public
 */
export type AdditionalMetadataContainerBoxChild<V extends IsoInt64 = number> = IsoBox<V>

/**
 * Additional Metadata Container Box (`meco`).
 *
 * ISO/IEC 14496-12:2015 - 8.11.7
 *
 * @public
 */
export type AdditionalMetadataContainerBox<V extends IsoInt64 = number> = {
	type: 'meco'
	boxes: AdditionalMetadataContainerBoxChild<V>[]
}
