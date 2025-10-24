import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet.ts'
import type { Representation } from '../../../../types/mapper/dash/Representation.ts'

/**
 * @internal
 *
 * Get the type of the content. It can be obtained directly from AdaptationSet or Representation
 * or can be inferred with the existing properties.
 *
 * @param adaptationSet - AdaptationSet to get the type from
 * @param representation - Representation to get the type from
 * @returns type of the content
 */
export function getContentType(
	adaptationSet: AdaptationSet,
	representation?: Representation,
): string {
	if (adaptationSet.$.contentType) {
		return adaptationSet.$.contentType
	}
	if (adaptationSet.ContentComponent?.at(0)) {
		return adaptationSet.ContentComponent.at(0)?.$.contentType ?? ''
	}
	if (adaptationSet.$.mimeType || representation?.$.mimeType) {
		const type =
			adaptationSet.$.mimeType?.split('/')[0] ||
			representation?.$.mimeType?.split('/')[0]
		if (type === 'audio' || type === 'video' || type === 'text') {
			return type
		}
		if (type === 'application') {
			return 'text'
		}
	}
	if (adaptationSet.$.maxHeight) {
		return 'video'
	}
	const adaptationRef =
		adaptationSet.$.id ??
		`group: ${adaptationSet.$.group}, lang: ${adaptationSet.$.lang}`
	console.error(
		`Could not find contentType from adaptationSet ${adaptationRef}`,
	)
	console.info('Using "text" as default contentType')
	return 'text'
}
