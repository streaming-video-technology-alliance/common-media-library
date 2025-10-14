import type { Validation } from '../../types/Validation.ts';
import type { Presentation } from '../../types/model/Presentation.ts';

import { validateSelectionSets } from './validateSelectionSets.ts';

/**
 * Validate a presentation.
 * It validates in cascade, calling each child validation method.
 *
 * Validations:
 * - Presentation has id
 *
 * @example
 * ```ts
 * import cmaf, { Presentation } from '@svta/common-media-library/cmaf-ham';
 * ...
 *
 * // const presentation: Presentation = ...;
 *
 * const validation = cmaf.validatePresentation(presentation);
 * ```
 *
 * Example output: `{ status: true|false, errorMessages: [...] }`
 *
 * @param presentation - Presentation from cmaf ham model
 * @returns Validation
 *
 * @alpha
 *
 */
export function validatePresentation(presentation: Presentation): Validation {
	const validation: Validation = { status: true, errorMessages: [] };

	if (!presentation.id) {
		validation.status = false;
		validation.errorMessages.push('Presentation id is undefined');
	}

	validateSelectionSets(
		presentation.selectionSets,
		presentation.id,
		validation,
	);

	return validation;
}
