import { verifySignerBinding } from '../../src/cose/verifySignerBinding.ts'
import { ok, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('verifySignerBinding', () => {
	// #region example
	it('returns false for a signer binding with an invalid signature', async () => {
		// Generate an Ed25519 key pair for testing
		const keyPair = await crypto.subtle.generateKey('Ed25519', false, ['sign', 'verify'])

		// Export the public key as JWK to build a COSE key structure
		const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
		const xBytes = Uint8Array.from(atob((jwk.x ?? '').replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))

		// Build a minimal COSE key map (kty=1 OKP, crv=6 Ed25519)
		const sessionCoseKey = new Map<number, unknown>([
			[1, 1],    // kty: OKP
			[-1, 6],   // crv: Ed25519
			[-2, xBytes],
		])

		// A minimal COSE_Sign1 with empty signature (will fail verification)
		const minimal = new Uint8Array([0x84, 0x40, 0xa0, 0x45, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x40])
		const certBytes = new Uint8Array([0x30, 0x03, 0x01, 0x01, 0xff])

		const isValid = await verifySignerBinding(minimal, sessionCoseKey, certBytes)
		strictEqual(isValid, false)
	})
	// #endregion example

	it('throws for an unsupported COSE key type', async () => {
		const invalidKey = new Map([[1, 99]])
		const minimal = new Uint8Array([0x84, 0x40, 0xa0, 0x45, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x40])
		try {
			await verifySignerBinding(minimal, invalidKey, new Uint8Array(4))
			ok(false, 'should have thrown')
		} catch (err) {
			ok((err as Error).message.includes('Unsupported COSE key type'))
		}
	})
})
