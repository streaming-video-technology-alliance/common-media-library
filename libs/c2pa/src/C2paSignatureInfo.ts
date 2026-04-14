/**
 * Signature information extracted from a C2PA claim
 *
 * @public
 */
export type C2paSignatureInfo = {
	readonly issuer: string | null
	readonly certNotBefore: string | null
}
