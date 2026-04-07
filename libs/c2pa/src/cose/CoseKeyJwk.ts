/**
 * A JWK (JSON Web Key) representation of a COSE public key,
 * suitable for use with the WebCrypto `importKey` API.
 *
 * @internal
 */
export type CoseKeyJwk = {
	readonly kty: string
	readonly crv: string
	readonly x: string
	readonly y?: string
}
