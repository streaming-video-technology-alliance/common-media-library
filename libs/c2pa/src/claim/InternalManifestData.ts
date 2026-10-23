import type { C2paManifest } from '../C2paManifest.ts'
import type { C2paStatusCode } from '../C2paStatusCode.ts'
import type { ClaimAssertionRef } from './ClaimAssertionRef.ts'

/**
 * An assertion with its raw JUMBF box payload preserved for hash verification.
 *
 * @internal
 */
export type InternalAssertionData = {
	readonly label: string
	readonly data: unknown
	readonly rawBoxPayload: Uint8Array
	/** The CBOR of the assertion with its tags, absent for a JSON or binary assertion and for CBOR that does not decode */
	readonly taggedData?: unknown
	/** `ASSERTION_CBOR_INVALID` if the CBOR of the assertion does not decode, `ASSERTION_JSON_INVALID` if the JSON of the assertion does not parse, else absent */
	readonly code?:
		| typeof C2paStatusCode.ASSERTION_CBOR_INVALID
		| typeof C2paStatusCode.ASSERTION_JSON_INVALID
}

/**
 * Enriched manifest data for claim-level validation.
 *
 * Contains the raw bytes needed for assertion hash checks and
 * claim signature verification, alongside the public manifest.
 *
 * @internal
 */
export type InternalManifestData = {
	readonly manifest: C2paManifest
	/** The JUMBF label of the manifest, which is its manifest identifier (C2PA URN). Null if the label is absent or the claim `signature` URI does not name it. */
	readonly manifestId: string | null
	readonly claimAssertionRefs: readonly ClaimAssertionRef[]
	readonly claimCborBytes: Uint8Array | null
	/** `CLAIM_MULTIPLE` if the manifest has more than one claim box, `CLAIM_CBOR_INVALID` if the claim box CBOR does not decode, `CLAIM_MALFORMED` if it is not a map, else null */
	readonly claimCode:
		| typeof C2paStatusCode.CLAIM_MULTIPLE
		| typeof C2paStatusCode.CLAIM_CBOR_INVALID
		| typeof C2paStatusCode.CLAIM_MALFORMED
		| null
	/** `CLAIM_SIGNATURE_MISSING` if the decoded claim has no `signature` URI that resolves to the signature box of this manifest (§15.7), else null */
	readonly signatureUriCode: typeof C2paStatusCode.CLAIM_SIGNATURE_MISSING | null
	readonly signatureBytes: Uint8Array | null
	readonly assertions: readonly InternalAssertionData[]
}
