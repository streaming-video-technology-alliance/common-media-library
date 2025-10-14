import type { SelectionSet } from '../../types/model/SelectionSet.ts'
import type { Validation } from '../../types/Validation.ts'

import { validateSelectionSet } from './validateSelectionSet.ts'

/**
 * Validate a list of selection set.
 * It validates in cascade, calling each child validation method.
 *
 * @example
 * ```ts
 * import cmaf, { SelectionSet } from '@svta/common-media-library/cmaf-ham';
 * ...
 *
 * // const selectionSets: SelectionSet[] = ...;
 *
 * const validation = cmaf.validateSelectionSets(selectionSets);
 * ```
 *
 * Example output: `{ status: true|false, errorMessages: [...] }`
 *
 * @param selectionSets - List of SelectionSet from cmaf ham model
 * @param presentationId - Optional: parent presentation id
 * @param prevValidation - Optional: validation object from parent previous validate method call
 * @returns Validation
 *
 * @alpha
 *
 */
export function validateSelectionSets(
	selectionSets: SelectionSet[],
	presentationId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	}

	selectionSets.forEach((selectionSet: SelectionSet) => {
		validateSelectionSet(selectionSet, presentationId, validation)
	})

	return validation
}
