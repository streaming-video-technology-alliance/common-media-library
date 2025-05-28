import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet.js';

/**
 * @internal
 *
 * Get the language from an adaptation set.
 *
 * @param adaptationSet - AdaptationSet to get the language from
 * @returns language of the content
 */
export function getLanguage(adaptationSet: AdaptationSet): string {
	let language = adaptationSet.$.lang;
	if (!language) {
		console.info(
			`AdaptationSet ${adaptationSet.$.id} has no lang, using "und" as default`,
		);
		language = 'und';
	}
	return language;
}
