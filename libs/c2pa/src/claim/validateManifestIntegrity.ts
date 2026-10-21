import type { C2paStatusCode } from '../C2paStatusCode.ts'
import { C2paStatusCode as Code } from '../C2paStatusCode.ts'
import { extractCertificateFromSignatureBytes } from '../extractManifestCertificate.ts'
import type { InternalAssertionData, InternalManifestData } from './InternalManifestData.ts'
import { validateActionIngredients } from './validateActionIngredients.ts'
import { extractLabelFromUrl, validateAssertionHashes } from './validateAssertionHashes.ts'
import { verifyClaimSignature } from './verifyClaimSignature.ts'

// §9.1/§15.10.1.2: the labels of the hard binding assertions. A standard manifest has exactly
// one. The deprecated c2pa.hash.bmff.v2 is included because the rule counts it as a hard binding.
const HARD_BINDING_LABELS = /* @__PURE__ */ new Set<string>([
	'c2pa.hash.data',
	'c2pa.hash.boxes',
	'c2pa.hash.collection.data',
	'c2pa.hash.bmff.v2',
	'c2pa.hash.bmff.v3',
])

// §6.4: a repeated assertion of the same type adds a double underscore and an index to the label.
// A part binding such as c2pa.hash.data.part keeps its own suffix and is not a standard hard binding (§18.9.2).
const ASSERTION_INSTANCE_SUFFIX = /__\d+$/

/**
 * Outcome of the manifest integrity checks.
 *
 * @internal
 */
export type ManifestIntegrity = {
	/** Status codes for the failures found, empty when every check passes */
	readonly codes: readonly C2paStatusCode[]
	/** DER-encoded end-entity certificate from the claim signature, or `null` when the signature is absent or carries no certificate */
	readonly certificate: Uint8Array | null
	/** The assertions whose claim reference resolved to a single box with a matching hash. Read an assertion by label from this list, not from the raw store. The list is authenticated only when `codes` is empty. */
	readonly verifiedAssertions: readonly InternalAssertionData[]
	/** The number of hard binding assertions in the assertion store */
	readonly hardBindingCount: number
}

type ClaimSignatureCheck = {
	readonly code: C2paStatusCode | null
	readonly certificate: Uint8Array | null
}

/**
 * Checks the claim signature per §15.7 and fails closed: a manifest without a claim box,
 * without a `c2pa.signature` box, with a claim `signature` URI that does not resolve to that
 * box, or with a signature that carries no certificate or does not verify over the claim bytes,
 * is reported as a failure. A manifest with more than one claim box reports `CLAIM_MULTIPLE`
 * through `claimCode` (§15.6.1), so no signature check runs.
 */
async function validateClaimSignature({ claimCborBytes, claimCode, signatureUriCode, signatureBytes }: InternalManifestData): Promise<ClaimSignatureCheck> {
	const certificate = signatureBytes ? extractCertificateFromSignatureBytes(signatureBytes) : null

	if (claimCode === Code.CLAIM_MULTIPLE) return { code: null, certificate }
	if (!claimCborBytes) return { code: Code.CLAIM_MISSING, certificate }
	if (!signatureBytes || signatureUriCode) return { code: Code.CLAIM_SIGNATURE_MISSING, certificate }
	if (!certificate) return { code: Code.CLAIM_SIGNATURE_MISMATCH, certificate }

	const signatureValid = await verifyClaimSignature(signatureBytes, claimCborBytes, certificate)
	return { code: signatureValid ? null : Code.CLAIM_SIGNATURE_MISMATCH, certificate }
}

/**
 * Validates the integrity of a C2PA manifest per Chapter 15 and Chapter 18.
 *
 * Runs these checks, in parallel where possible:
 * 1. Assertion reference resolution and hash verification (§8.4.1, §15.10.3.1)
 * 2. Assertion CBOR and JSON decoding (§15.10.3.1)
 * 3. Undeclared assertion detection (§15.10.3.1)
 * 4. Hard binding count (§9.1, §15.10.1.2)
 * 5. Action ingredient validation (§18.15.4.7)
 * 6. Claim signature verification (§15.7)
 *
 * The claim signature is verified with the end-entity certificate from the `x5chain`
 * header of the signature. The certificate is not checked against a trust list.
 *
 * @param internal - Enriched manifest data with raw assertion bytes and claim references
 * @returns The status codes for any failures found, the certificate of the claim signature, and the claim-verified assertions
 *
 * @internal
 */
export async function validateManifestIntegrity(internal: InternalManifestData): Promise<ManifestIntegrity> {
	const [assertionHashes, signature] = await Promise.all([
		validateAssertionHashes(internal.claimAssertionRefs, internal.assertions),
		validateClaimSignature(internal),
	])

	const codes: C2paStatusCode[] = [...assertionHashes.codes, ...validateActionIngredients(internal.assertions)]

	// §15.10.3.1: an assertion with CBOR that is not well-formed (RFC 8949 Appendix C) or JSON that does not conform (RFC 8259) fails the claim
	for (const assertion of internal.assertions) {
		if (assertion.code) codes.push(assertion.code)
	}

	// §9.1/§15.10.1.2: a manifest with more than one hard binding assertion is rejected. A numbered
	// instance such as c2pa.hash.bmff.v3__1 counts the same as its base label (§6.4).
	let hardBindingCount = 0
	for (const assertion of internal.assertions) {
		if (HARD_BINDING_LABELS.has(assertion.label.replace(ASSERTION_INSTANCE_SUFFIX, ''))) hardBindingCount++
	}
	if (hardBindingCount > 1) {
		codes.push(Code.ASSERTION_MULTIPLE_HARD_BINDINGS)
	}

	// §15.10.3.1: every assertion in the store must be referenced by the claim. This check needs a
	// decodable claim, so a missing or malformed claim reports only its own code.
	if (internal.claimCborBytes && !internal.claimCode) {
		const referencedLabels = new Set(internal.claimAssertionRefs.map(ref => extractLabelFromUrl(ref.url)))
		if (internal.assertions.some(assertion => !referencedLabels.has(assertion.label))) {
			codes.push(Code.ASSERTION_UNDECLARED)
		}
	}

	if (signature.code) {
		codes.push(signature.code)
	}
	if (internal.claimCode) {
		codes.push(internal.claimCode)
	}

	return { codes: [...new Set(codes)], certificate: signature.certificate, verifiedAssertions: assertionHashes.verified, hardBindingCount }
}
