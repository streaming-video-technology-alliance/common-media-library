import type { C2paManifest } from '../C2paManifest.ts'
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
	readonly signatureBytes: Uint8Array | null
	readonly assertions: readonly InternalAssertionData[]
}
