import type { PathwayClone } from './PathwayClone.js';

/**
 * Validates a pathway clone.
 *
 * @param clone - The pathway clone to validate.
 * @returns `true` if the pathway clone is valid, `false` otherwise.
 *
 * @group Content Steering
 *
 * @beta
 */
export function isValidPathwayClone(clone: PathwayClone): boolean {
	if (typeof clone !== 'object' || !clone) {
		return false;
	}

	const { ID, 'BASE-ID': BASE_ID, 'URI-REPLACEMENT': URI_REPLACEMENT } = clone;

	if (typeof ID !== 'string' || typeof BASE_ID !== 'string' || URI_REPLACEMENT == null || typeof URI_REPLACEMENT !== 'object') {
		return false;
	}

	return true;
}
