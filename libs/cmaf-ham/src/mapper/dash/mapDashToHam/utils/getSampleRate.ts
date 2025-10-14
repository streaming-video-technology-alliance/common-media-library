import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet.ts'
import type { Representation } from '../../../../types/mapper/dash/Representation.ts'

/**
 * @internal
 *
 * Get sample rate (audio).
 *
 * @param adaptationSet - AdaptationSet to try to get the sampleRate from
 * @param representation - Representation to try to get the sampleRate from
 * @returns Sample rate. In case it is not presents, it returns 0.
 */
export function getSampleRate(
	adaptationSet: AdaptationSet,
	representation: Representation,
): number {
	const sampleRate: number = +(
		representation.$.audioSamplingRate ??
		adaptationSet.$.audioSamplingRate ??
		0
	)
	if (!sampleRate) {
		console.error(
			`Representation ${representation.$.id} has no audioSamplingRate`,
		)
	}
	return sampleRate
}
