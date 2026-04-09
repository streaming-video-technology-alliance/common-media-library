/**
 * A decoded COSE_Sign1 structure (RFC 9052)
 *
 * @public
 */
export type CoseSign1 = {
	readonly protectedBytes: Uint8Array
	readonly protectedHeader: Readonly<Record<number, unknown>>
	readonly unprotectedHeader: Readonly<Record<number, unknown>>
	readonly payload: Uint8Array | null
	readonly signature: Uint8Array
	readonly kid: Uint8Array | null
	readonly alg: number | null
}
