import type { C2paStatusCode } from '../C2paStatusCode.ts'
import { C2paStatusCode as Code } from '../C2paStatusCode.ts'
import { extractCertificateFromSignatureBytes } from '../extractManifestCertificate.ts'
import type { InternalManifestData } from './InternalManifestData.ts'
import { validateActionIngredients } from './validateActionIngredients.ts'
import { validateAssertionHashes } from './validateAssertionHashes.ts'
import { verifyClaimSignature } from './verifyClaimSignature.ts'

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
}

type ClaimSignatureCheck = {
	readonly code: C2paStatusCode | null
	readonly certificate: Uint8Array | null
}

/**
 * Checks the claim signature per §15.7 and fails closed: a manifest without a claim box,
 * without a `c2pa.signature` box, or with a signature that carries no certificate or does
 * not verify over the claim bytes, is reported as a failure.
 */
async function validateClaimSignature({ claimCborBytes, signatureBytes }: InternalManifestData): Promise<ClaimSignatureCheck> {
	const certificate = signatureBytes ? extractCertificateFromSignatureBytes(signatureBytes) : null

	if (!claimCborBytes) return { code: Code.CLAIM_MISSING, certificate }
	if (!signatureBytes) return { code: Code.CLAIM_SIGNATURE_MISSING, certificate }
	if (!certificate) return { code: Code.CLAIM_SIGNATURE_MISMATCH, certificate }

	const signatureValid = await verifyClaimSignature(signatureBytes, claimCborBytes, certificate)
	return { code: signatureValid ? null : Code.CLAIM_SIGNATURE_MISMATCH, certificate }
}

/**
 * Validates the integrity of a C2PA manifest per Chapter 15 and Chapter 18.
 *
 * Runs four validation checks in parallel where possible:
 * 1. Assertion hash verification (§15.10.3.1)
 * 2. Missing assertion detection (§15.10.3.1)
 * 3. Action ingredient validation (§18.15.4.7)
 * 4. Claim signature verification (§15.7)
 *
 * The claim signature is verified with the end-entity certificate from the `x5chain`
 * header of the signature. The certificate is not checked against a trust list.
 *
 * @param internal - Enriched manifest data with raw assertion bytes and claim references
 * @returns The status codes for any failures found, and the certificate of the claim signature
 *
 * @internal
 */
export async function validateManifestIntegrity(internal: InternalManifestData): Promise<ManifestIntegrity> {
	const [assertionHashCodes, signature] = await Promise.all([
		validateAssertionHashes(internal.claimAssertionRefs, internal.assertions),
		validateClaimSignature(internal),
	])

	const codes: C2paStatusCode[] = [...assertionHashCodes, ...validateActionIngredients(internal.assertions)]

	if (signature.code) {
		codes.push(signature.code)
	}

	return { codes, certificate: signature.certificate }
}
