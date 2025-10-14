import type { Segment } from '../../types/model/Segment.ts';
import type { Validation } from '../../types/Validation.ts';

import { validateSegment } from './validateSegment.ts';

/**
 * Validate a list of segments.
 *
 * @example
 * ```ts
 * import cmaf, { Segment } from '@svta/common-media-library/cmaf-ham';
 * ...
 *
 * // const segments: Segment[] = ...;
 *
 * const validation = cmaf.validateSegments(segments);
 * ```
 *
 * Example output: `{ status: true|false, errorMessages: [...] }`
 *
 * @param segments - List of Segment from cmaf ham model
 * @param trackId - Optional: parent track id
 * @param prevValidation - Optional: validation object from parent previous validate method call
 * @returns Validation
 *
 * @alpha
 *
 */
export function validateSegments(
	segments: Segment[],
	trackId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};

	segments.forEach((segment: Segment) => {
		validateSegment(segment, trackId, validation);
	});

	return validation;
}
