import type { C2paStatusCode } from '../C2paStatusCode.ts'
import { C2paStatusCode as Code } from '../C2paStatusCode.ts'
import type { InternalManifestData } from './InternalManifestData.ts'
import { validateActionIngredients } from './validateActionIngredients.ts'
import { validateAssertionHashes } from './validateAssertionHashes.ts'
import { verifyClaimSignature } from './verifyClaimSignature.ts'

/**
 * Validates the integrity of a C2PA manifest per Chapter 15 and Chapter 18.
 *
 * Runs four validation checks in parallel where possible:
 * 1. Assertion hash verification (§15.10.3.1)
 * 2. Missing assertion detection (§15.10.3.1)
 * 3. Action ingredient validation (§18.15.4.7)
 * 4. Claim signature verification (§15.7)
 *
 * @param internal - Enriched manifest data with raw assertion bytes and claim references
 * @param certificateDER - DER-encoded end-entity certificate, or `null` to skip signature check
 * @returns Array of C2PA status codes for any failures found (empty if all pass)
 *
 * @internal
 */
export async function validateManifestIntegrity(
	internal: InternalManifestData,
	certificateDER: Uint8Array | null,
): Promise<readonly C2paStatusCode[]> {
	const { signatureBytes, claimCborBytes } = internal

	const [assertionHashCodes, signatureValid] = await Promise.all([
		validateAssertionHashes(internal.claimAssertionRefs, internal.assertions),
		signatureBytes && claimCborBytes && certificateDER
			? verifyClaimSignature(signatureBytes, claimCborBytes, certificateDER)
			: Promise.resolve(true),
	])

	const actionCodes = validateActionIngredients(internal.assertions)

	const codes: C2paStatusCode[] = [...assertionHashCodes, ...actionCodes]

	if (!signatureValid) {
		codes.push(Code.CLAIM_SIGNATURE_MISMATCH)
	}

	return codes
}
