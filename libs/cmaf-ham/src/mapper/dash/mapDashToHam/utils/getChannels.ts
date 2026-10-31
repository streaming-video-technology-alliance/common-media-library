import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet.ts'
import type { Representation } from '../../../../types/mapper/dash/Representation.ts'

/**
 * @internal
 *
 * Get the channels value (audio). It can be present on adaptationSet or representation.
 *
 * @param adaptationSet - AdaptationSet to try to get the channels from
 * @param representation - Representation to try to get the channels from
 * @returns Channels value. In case it is not present, returns 0.
 */
export function getChannels(adaptationSet: AdaptationSet, representation: Representation): number {
	return +(
		adaptationSet.AudioChannelConfiguration?.at(0)?.$.value ??
		representation.AudioChannelConfiguration?.at(0)?.$.value ??
		0
	)
}
