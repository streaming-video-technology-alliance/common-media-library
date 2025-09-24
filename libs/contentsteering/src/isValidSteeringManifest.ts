import { isValidPathwayClone } from './isValidPathwayClone.js';
import type { SteeringManifest } from './SteeringManifest.js';

/**
 * Validates a steering manifest.
 *
 * @param manifest - The steering manifest to validate.
 * @returns `true` if the steering manifest is valid, `false` otherwise.
 *
 * @group Content Steering
 *
 * @beta
 */
export function isValidSteeringManifest(manifest: SteeringManifest): boolean {
	if (!manifest) {
		return false;
	}

	const { VERSION, TTL, 'PATHWAY-PRIORITY': PATHWAY_PRIORITY, 'PATHWAY-CLONES': PATHWAY_CLONES } = manifest;

	// version is required and must be a valid number
	if (typeof VERSION !== 'number' || VERSION !== 1) {
		return false;
	}

	// TTL must be a valid number and greater than 0
	if (typeof TTL !== 'number' || TTL <= 0) {
		return false;
	}

	// PATHWAY-PRIORITY must be an array of strings and must not contain duplicates
	if (!Array.isArray(PATHWAY_PRIORITY) || PATHWAY_PRIORITY.length === 0 || new Set(PATHWAY_PRIORITY).size !== PATHWAY_PRIORITY.length) {
		return false;
	}

	// PATHWAY-CLONES must be an array of valid pathway clones
	if (PATHWAY_CLONES && (!Array.isArray(PATHWAY_CLONES) || PATHWAY_CLONES.length === 0 || PATHWAY_CLONES.some(clone => !isValidPathwayClone(clone)))) {
		return false;
	}

	return true;
}
