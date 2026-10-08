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
	readonly claimAssertionRefs: readonly ClaimAssertionRef[]
	readonly claimCborBytes: Uint8Array | null
	/** `CLAIM_CBOR_INVALID` if the claim box CBOR does not decode, `CLAIM_MALFORMED` if it is not a map, else null */
	readonly claimCode: typeof C2paStatusCode.CLAIM_CBOR_INVALID | typeof C2paStatusCode.CLAIM_MALFORMED | null
	readonly signatureBytes: Uint8Array | null
	readonly assertions: readonly InternalAssertionData[]
}
