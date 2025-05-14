import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet';
import type { Representation } from '../../../../types/mapper/dash/Representation';

/**
 * @internal
 *
 * Get the sar value. It can be present on adaptationSet or representation.
 *
 * @param adaptationSet - AdaptationSet to try to get the sar from
 * @param representation - AdaptationSet to try to get the sar from
 * @returns sar value. In case it is not present, returns empty string.
 */
export function getSar(
	adaptationSet: AdaptationSet,
	representation: Representation,
): string {
	const sar: string = representation.$.sar ?? adaptationSet.$.sar ?? '';
	if (!sar) {
		console.error(`Representation ${representation.$.id} has no sar`);
	}
	return sar;
}
