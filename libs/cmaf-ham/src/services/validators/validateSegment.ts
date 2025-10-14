import type { Segment } from '../../types/model/Segment.ts';
import type { Validation } from '../../types/Validation.ts';

/**
 * Validate a segment.
 *
 * Validations:
 * - segment has duration
 * - segment has url
 *
 * @param segment - Segment from cmaf ham model
 * @param trackId - Optional: parent track id
 * @param prevValidation - Optional: validation object from parent previous validate method call
 * @returns Validation
 *
 * @alpha
 */
export function validateSegment(
	segment: Segment,
	trackId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};
	const moreInformation = trackId
		? ` in the track with id = ${trackId}`
		: '.';

	if (!segment.duration) {
		validation.status = false;
		validation.errorMessages.push(
			`Segment duration is undefined${moreInformation}`,
		);
	}

	if (!segment.url) {
		validation.status = false;
		validation.errorMessages.push(
			`Segment url is undefined${moreInformation}`,
		);
	}

	return validation;
}
