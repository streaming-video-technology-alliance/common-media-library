import type { SubSampleInformationSubsample } from './SubSampleInformationSubsample.ts'

/**
 * An entry of the Sub-Sample Information Box (`subs`).
 *
 * @public
 */
export type SubSampleInformationEntry = {
	sampleDelta: number
	subsampleCount: number
	subsamples: SubSampleInformationSubsample[]
}
