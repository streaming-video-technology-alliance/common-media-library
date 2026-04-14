import { C2paStatusCode } from '../C2paStatusCode.ts'

const ACTIONS_LABELS = new Set(['c2pa.actions', 'c2pa.actions.v2'])
const ACTIONS_REQUIRING_INGREDIENTS = new Set(['c2pa.opened', 'c2pa.placed', 'c2pa.removed'])

/**
 * Validates action ingredient references per C2PA §18.15.4.7.
 *
 * For any `c2pa.actions` or `c2pa.actions.v2` assertion, actions with type
 * `c2pa.opened`, `c2pa.placed`, or `c2pa.removed` must include a
 * `parameters.ingredients` field. Reports `assertion.action.ingredientMismatch`
 * if any such action is missing the required field.
 *
 * @param assertions - Parsed assertions (label + decoded data)
 * @returns Array of C2PA status codes for any failures found
 *
 * @internal
 */
export function validateActionIngredients(
	assertions: readonly { readonly label: string; readonly data: unknown }[],
): readonly C2paStatusCode[] {
	const codes: C2paStatusCode[] = []

	for (const assertion of assertions) {
		if (!ACTIONS_LABELS.has(assertion.label)) continue

		const data = assertion.data as Record<string, unknown> | null
		if (!data) continue

		const actions = data['actions'] as unknown[] | undefined
		if (!Array.isArray(actions)) continue

		for (const action of actions) {
			if (!action || typeof action !== 'object') continue
			const record = action as Record<string, unknown>
			const actionType = record['action'] as string | undefined
			if (!actionType || !ACTIONS_REQUIRING_INGREDIENTS.has(actionType)) continue

			const parameters = record['parameters'] as Record<string, unknown> | undefined
			const ingredients = parameters?.['ingredients']

			if (!Array.isArray(ingredients) || ingredients.length === 0) {
				codes.push(C2paStatusCode.ASSERTION_ACTION_INGREDIENT_MISMATCH)
			}
		}
	}

	return codes
}
