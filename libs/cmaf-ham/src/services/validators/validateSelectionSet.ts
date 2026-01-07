import type { SelectionSet } from '../../types/model/SelectionSet.ts'
import type { Validation } from '../../types/mapper/Validation.ts'

import { validateSwitchingSets } from './validateSwitchingSets.ts'


/**
 * Validate a selection set.
 * It validates in cascade, calling each child validation method.
 *
 * Validations:
 * - SelectionSet has id
 *
 * @example
 * ```ts
 * import cmaf, { SelectionSet } from '@svta/common-media-library/cmaf-ham';
 * ...
 *
 * // const selectionSet: SelectionSet = ...;
 *
 * const validation = cmaf.validateSelectionSet(selectionSet);
 * ```
 *
 * Example output: `{ status: true|false, errorMessages: [...] }`
 *
 * @param selectionSet - SelectionSet from cmaf ham model
 * @param presentationId - Optional: parent presentation id
 * @param prevValidation - Optional: validation object from parent previous validate method call
 * @returns Validation
 *
 * @alpha
 *
 */
export function validateSelectionSet(
	selectionSet: SelectionSet,
	presentationId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	}
	const moreInformation = presentationId
		? ` in the presentation with id = ${presentationId}`
		: '.'

	if (!selectionSet.id) {
		validation.status = false
		validation.errorMessages.push(
			`SelectionSet id is undefined${moreInformation}`,
		)
	}

	validateSwitchingSets(
		selectionSet.switchingSets,
		selectionSet.id,
		validation,
	)

	return validation
}
