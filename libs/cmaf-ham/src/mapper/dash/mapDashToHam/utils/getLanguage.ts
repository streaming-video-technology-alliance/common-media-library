import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet.ts'

/**
 * @internal
 *
 * Get the language from an adaptation set.
 *
 * @param adaptationSet - AdaptationSet to get the language from
 * @returns language of the content. In case it is not present, returns `und`.
 */
export function getLanguage(adaptationSet: AdaptationSet): string {
	return adaptationSet.$.lang || 'und'
}
