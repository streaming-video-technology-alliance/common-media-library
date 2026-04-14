import { C2paStatusCode } from '../C2paStatusCode.ts'
import { hashesEqual, normalizeAlgorithmName } from '../utils.ts'
import type { ClaimAssertionRef } from './ClaimAssertionRef.ts'
import type { InternalAssertionData } from './InternalManifestData.ts'

/**
 * Extracts the assertion label from a JUMBF URI.
 *
 * Handles both absolute (`self#jumbf=/c2pa/<manifest>/c2pa.assertions/<label>`)
 * and relative URI forms by returning the last path segment.
 */
function extractLabelFromUrl(url: string): string {
	const fragmentIndex = url.indexOf('#jumbf=')
	const path = fragmentIndex >= 0 ? url.substring(fragmentIndex + 7) : url
	const lastSlash = path.lastIndexOf('/')
	return lastSlash >= 0 ? path.substring(lastSlash + 1) : path
}

/**
 * Validates assertion hashes and presence per C2PA §15.10.3.1.
 *
 * For each assertion referenced in the claim's hashed URI list:
 * - Checks that the assertion exists in the assertion store (`assertion.missing`)
 * - Recomputes the hash of the raw JUMBF box payload and compares it to the
 *   expected hash from the claim (`assertion.hashedURI.mismatch`)
 *
 * @param claimRefs - Hashed URI references from the claim
 * @param assertions - Parsed assertions with preserved raw box payloads
 * @returns Array of C2PA status codes for any failures found
 *
 * @internal
 */
export async function validateAssertionHashes(
	claimRefs: readonly ClaimAssertionRef[],
	assertions: readonly InternalAssertionData[],
): Promise<readonly C2paStatusCode[]> {
	if (claimRefs.length === 0) return []

	const assertionsByLabel = new Map<string, InternalAssertionData>()
	for (const assertion of assertions) {
		assertionsByLabel.set(assertion.label, assertion)
	}

	const codes: C2paStatusCode[] = []

	const hashChecks = claimRefs.map(async (ref) => {
		const label = extractLabelFromUrl(ref.url)
		const assertion = assertionsByLabel.get(label)

		if (!assertion) {
			return C2paStatusCode.ASSERTION_MISSING
		}

		const alg = ref.alg ? normalizeAlgorithmName(ref.alg) : 'SHA-256'
		const computedHash = new Uint8Array(
			await crypto.subtle.digest(alg, assertion.rawBoxPayload),
		)

		if (!hashesEqual(computedHash, ref.hash)) {
			return C2paStatusCode.ASSERTION_HASHEDURI_MISMATCH
		}

		return null
	})

	const results = await Promise.all(hashChecks)
	for (const result of results) {
		if (result) codes.push(result)
	}

	return codes
}
