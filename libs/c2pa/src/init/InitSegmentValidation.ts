import type { C2paManifest } from '../C2paManifest.ts'
import type { CoseKeyJwk } from '../cose/CoseKeyJwk.ts'
import type { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'

/**
 * A session key extracted and verified from a C2PA `c2pa.session-keys` assertion.
 *
 * Only keys whose signer binding is valid and whose validity period has not expired
 * are included in {@link InitSegmentValidation.sessionKeys}.
 *
 * @public
 */
export type ValidatedSessionKey = {
	readonly kid: string
	readonly jwk: CoseKeyJwk
	readonly minSequenceNumber: number
	readonly validityPeriod: number
	readonly createdAt: string
}

/**
 * Result of validating a C2PA init segment.
 *
 * Returned by {@link validateC2paInitSegment}.
 *
 * @public
 */
export type InitSegmentValidation = {
	readonly activeManifest: C2paManifest | null
	readonly certificate: Uint8Array | null
	readonly manifestId: string | null
	readonly sessionKeys: readonly ValidatedSessionKey[]
	readonly isValid: boolean
	readonly errorCodes: readonly LiveVideoStatusCode[]
}
