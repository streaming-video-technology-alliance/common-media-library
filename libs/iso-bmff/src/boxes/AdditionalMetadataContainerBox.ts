import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Additional Metadata Container Box (`meco`).
 *
 * ISO/IEC 14496-12:2015 - 8.11.7
 *
 * @public
 */
export type AdditionalMetadataContainerBox<V extends IsoInt64 = number> = {
	type: 'meco'
	boxes: ParsedIsoBox<V>[]
}
