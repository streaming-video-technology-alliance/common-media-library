import { C2paStatusCode } from '../C2paStatusCode.ts'
import { hashesEqual, normalizeAlgorithmName } from '../utils.ts'
import type { ClaimAssertionRef } from './ClaimAssertionRef.ts'
import type { InternalAssertionData } from './InternalManifestData.ts'

/**
 * Extracts the assertion label from a JUMBF URI.
 *
 * Handles both absolute (`self#jumbf=/c2pa/<manifest>/c2pa.assertions/<label>`)
 * and relative URI forms by returning the last path segment.
 *
 * @internal
 */
export function extractLabelFromUrl(url: string): string {
	const fragmentIndex = url.indexOf('#jumbf=')
	const path = fragmentIndex >= 0 ? url.substring(fragmentIndex + 7) : url
	const lastSlash = path.lastIndexOf('/')
	return lastSlash >= 0 ? path.substring(lastSlash + 1) : path
}

/**
 * Outcome of the assertion hash checks.
 *
 * @internal
 */
export type AssertionHashResult = {
	/** Status codes for the failures found, empty when every referenced assertion resolves and matches */
	readonly codes: readonly C2paStatusCode[]
	/** The assertions whose claim reference resolved to a single box with a matching hash */
	readonly verified: readonly InternalAssertionData[]
}

/**
 * Validates assertion hashes and presence per C2PA §8.4.1 and §15.10.3.1.
 *
 * For each assertion referenced in the claim's hashed URI list:
 * - Resolves the label to a box in the assertion store. If the store holds no box
 *   with that label, or more than one, the reference is unresolved (`assertion.missing`, §8.4.1).
 * - Recomputes the hash of the raw JUMBF box payload and compares it to the
 *   expected hash from the claim (`assertion.hashedURI.mismatch`).
 *
 * The `verified` list holds only the assertions that resolved to one box with a matching
 * hash. A caller that consumes an assertion by label must read it from `verified`, so that
 * an unverified or ambiguous box is never used.
 *
 * @param claimRefs - Hashed URI references from the claim
 * @param assertions - Parsed assertions with preserved raw box payloads
 * @returns The status codes for any failures found, and the verified assertions
 *
 * @internal
 */
export async function validateAssertionHashes(
	claimRefs: readonly ClaimAssertionRef[],
	assertions: readonly InternalAssertionData[],
): Promise<AssertionHashResult> {
	if (claimRefs.length === 0) return { codes: [], verified: [] }

	const boxesByLabel = new Map<string, InternalAssertionData[]>()
	for (const assertion of assertions) {
		const existing = boxesByLabel.get(assertion.label)
		if (existing) existing.push(assertion)
		else boxesByLabel.set(assertion.label, [assertion])
	}

	const hashChecks = claimRefs.map(async ref => {
		const label = extractLabelFromUrl(ref.url)
		const boxes = boxesByLabel.get(label)

		// Missing, or ambiguous (§8.4.1): an unresolved reference fails as assertion.missing.
		if (!boxes || boxes.length !== 1) {
			return { code: C2paStatusCode.ASSERTION_MISSING, verified: null }
		}

		const assertion = boxes[0]
		const alg = ref.alg ? normalizeAlgorithmName(ref.alg) : 'SHA-256'
		const computedHash = new Uint8Array(
			await crypto.subtle.digest(alg, assertion.rawBoxPayload as Uint8Array<ArrayBuffer>),
		)

		if (!hashesEqual(computedHash, ref.hash)) {
			return { code: C2paStatusCode.ASSERTION_HASHEDURI_MISMATCH, verified: null }
		}

		return { code: null, verified: assertion }
	})

	const results = await Promise.all(hashChecks)
	const codes: C2paStatusCode[] = []
	const verified: InternalAssertionData[] = []
	for (const result of results) {
		if (result.code) codes.push(result.code)
		if (result.verified) verified.push(result.verified)
	}

	return { codes, verified }
}
