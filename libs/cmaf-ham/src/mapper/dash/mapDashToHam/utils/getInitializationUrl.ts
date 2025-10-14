import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet.ts'
import type { Representation } from '../../../../types/mapper/dash/Representation.ts'

/**
 * @internal
 *
 * Get the initialization url. It can be present on AdaptationSet or Representation.
 *
 * Url initialization is present on segments.
 *
 * @param adaptationSet - AdaptationSet to try to get the initialization url from
 * @param representation - Representation to try to get the initialization url from
 */
export function getInitializationUrl(
	adaptationSet: AdaptationSet,
	representation: Representation,
): string | undefined {
	let initializationUrl: string | undefined
	if (representation.SegmentBase) {
		initializationUrl = representation.BaseURL![0] ?? ''
	}
	else if (adaptationSet.SegmentList || representation.SegmentList) {
		initializationUrl =
			representation.SegmentList?.at(0)?.Initialization[0].$.sourceURL ||
			adaptationSet.SegmentList?.at(0)?.Initialization[0].$.sourceURL
	}
	if (adaptationSet.SegmentTemplate || representation.SegmentTemplate) {
		initializationUrl =
			adaptationSet.SegmentTemplate?.at(0)?.$.initialization ||
			representation.SegmentTemplate?.at(0)?.$.initialization
		if (initializationUrl?.includes('$RepresentationID$')) {
			initializationUrl = initializationUrl.replace(
				'$RepresentationID$',
				representation.$.id ?? '',
			)
		}
	}
	return initializationUrl
}
