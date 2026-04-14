/**
 * A hashed URI reference from a C2PA claim's assertion list.
 *
 * Each entry in `created_assertions` / `gathered_assertions` (v2) or
 * `assertions` (v1) maps to one of these references, containing the
 * assertion's JUMBF URI and the expected hash of its JUMBF box payload.
 *
 * @internal
 */
export type ClaimAssertionRef = {
	readonly url: string
	readonly hash: Uint8Array
	readonly alg: string | null
}
