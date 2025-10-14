import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet.ts'
import type { Representation } from '../../../../types/mapper/dash/Representation.ts'

/**
 * @internal
 *
 * Get the codec value (video and audio). It can be present on adaptationSet or representation.
 *
 * @param adaptationSet - AdaptationSet to try to get the codec from
 * @param representation - Representation to try to get the codec from
 * @returns Content codec
 */
export function getCodec(
	adaptationSet: AdaptationSet,
	representation: Representation,
): string {
	const codec = representation.$.codecs ?? adaptationSet.$.codecs ?? ''
	if (!codec) {
		console.error(`Representation ${representation.$.id} has no codecs`)
	}
	return codec
}
