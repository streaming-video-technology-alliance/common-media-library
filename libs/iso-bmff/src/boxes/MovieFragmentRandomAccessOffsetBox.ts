import type { FullBox } from './FullBox.ts'

/**
 * Movie Fragment Random Access Offset Box (`mfro`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.11
 *
 * @public
 */
export type MovieFragmentRandomAccessOffsetBox = FullBox & {
	type: 'mfro'
	/** The size in bytes of the enclosing `mfra` box. The spec name of the field is `size` (ISO/IEC 14496-12:2015 - 8.8.11.3). The writer writes the stored value, so set the field after a change to the children of the `mfra` box. */
	mfraSize: number
}
