import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet.ts'
import type { Representation } from '../../../../types/mapper/dash/Representation.ts'

/**
 * @internal
 *
 * Get the sar value. It can be present on adaptationSet or representation.
 *
 * @param adaptationSet - AdaptationSet to try to get the sar from
 * @param representation - Representation to try to get the sar from
 * @returns sar value. In case it is not present, returns empty string.
 */
export function getSar(adaptationSet: AdaptationSet, representation: Representation): string {
	return representation.$.sar ?? adaptationSet.$.sar ?? ''
}
