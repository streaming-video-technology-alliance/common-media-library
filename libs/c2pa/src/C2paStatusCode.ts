import type { ValueOf } from '@svta/cml-utils'

/**
 * Standard C2PA validation status codes for manifest integrity checks,
 * as defined in the C2PA specification chapters 15 and 18.
 *
 * @see {@link https://c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html#_claim_validation | C2PA Spec §15.10.3}
 *
 * @enum
 *
 * @public
 */
export const C2paStatusCode = {
	/** Assertion hash does not match the hashed URI in the claim (§15.10.3.1) */
	ASSERTION_HASHEDURI_MISMATCH: 'assertion.hashedURI.mismatch',
	/** An assertion referenced in the claim is missing from the assertion store (§15.10.3.1) */
	ASSERTION_MISSING: 'assertion.missing',
	/** An action requiring an ingredient reference does not have one (§18.15.4.7) */
	ASSERTION_ACTION_INGREDIENT_MISMATCH: 'assertion.action.ingredientMismatch',
	/** Claim signature verification failed (§15.7) */
	CLAIM_SIGNATURE_MISMATCH: 'claim.signature.mismatch',
} as const

/**
 * Union type of all {@link (C2paStatusCode:variable)} values.
 *
 * @public
 */
export type C2paStatusCode = ValueOf<typeof C2paStatusCode>
