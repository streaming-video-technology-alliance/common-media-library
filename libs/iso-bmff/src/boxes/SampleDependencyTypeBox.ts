import type { FullBox } from './FullBox.ts'

/**
 * Sample Dependency Type Box (`sdtp`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.4
 *
 * @public
 */
export type SampleDependencyTypeBox = FullBox & {
	type: 'sdtp'
	/**
	 * One byte for each sample. Each byte has four fields of 2 bits, from the high bits to the low bits:
	 * `is_leading`, `sample_depends_on`, `sample_is_depended_on`, and `sample_has_redundancy`.
	 *
	 * ISO/IEC 14496-12:2015 - 8.6.4.2
	 */
	sampleDependencyTable: Uint8Array
}
