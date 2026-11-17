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
	sampleDependencyTable: number[]
}
