import { verifySignerBinding } from '../../src/cose/verifySignerBinding.ts'
import { Encoder } from 'cbor-x/encode'
import { ok, strictEqual } from 'node:assert'
import { before, describe, it } from 'node:test'
import { createTestSigner } from '../testSigner.ts'
import { createTestSessionKey, encodeSignerBinding, type TestSessionKey } from '../vsi/vsiTestUtils.ts'

// Byte strings without CBOR tag 64.
const CBOR = new Encoder({ tagUint8Array: false })

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

		// A minimal COSE_Sign1 with a detached (nil) payload and an empty signature (will fail verification)
		const minimal = new Uint8Array([0x84, 0x40, 0xa0, 0xf6, 0x40])
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

	describe('Sig_structure payload (§18.25.2)', () => {
		let sessionKey: TestSessionKey
		let certificate: Uint8Array
		let certificateByteString: Uint8Array
		let otherCertificate: Uint8Array

		before(async () => {
			sessionKey = await createTestSessionKey('key_001')
			certificate = (await createTestSigner('Signer')).certificateDER
			certificateByteString = Uint8Array.from(CBOR.encode(certificate))
			otherCertificate = (await createTestSigner('Other Signer')).certificateDER
		})

		it('accepts a binding signed over the certificate', async () => {
			const binding = await encodeSignerBinding(sessionKey, certificate)

			strictEqual(await verifySignerBinding(binding, sessionKey.coseKey, certificate), true)
		})

		it('accepts a binding signed over the certificate encoded as a CBOR byte string', async () => {
			const binding = await encodeSignerBinding(sessionKey, certificateByteString)

			strictEqual(await verifySignerBinding(binding, sessionKey.coseKey, certificate), true)
		})

		it('accepts a binding with an empty payload', async () => {
			// The session keys example of §18.25.3 has an empty byte string as the payload.
			const binding = await encodeSignerBinding(sessionKey, certificate, new Uint8Array(0))

			strictEqual(await verifySignerBinding(binding, sessionKey.coseKey, certificate), true)
		})

		it('accepts a binding that embeds the signed certificate', async () => {
			const binding = await encodeSignerBinding(sessionKey, certificate, certificate)

			strictEqual(await verifySignerBinding(binding, sessionKey.coseKey, certificate), true)
		})

		it('accepts a binding that embeds the signed certificate encoded as a CBOR byte string', async () => {
			const binding = await encodeSignerBinding(sessionKey, certificateByteString, certificateByteString)

			strictEqual(await verifySignerBinding(binding, sessionKey.coseKey, certificate), true)
		})

		it('rejects a binding signed over another certificate', async () => {
			const binding = await encodeSignerBinding(sessionKey, otherCertificate)

			strictEqual(await verifySignerBinding(binding, sessionKey.coseKey, certificate), false)
		})

		it('rejects a binding that embeds and signs another certificate', async () => {
			const binding = await encodeSignerBinding(sessionKey, otherCertificate, otherCertificate)

			strictEqual(await verifySignerBinding(binding, sessionKey.coseKey, certificate), false)
		})

		it('rejects a binding signed over the certificate that embeds another certificate', async () => {
			const binding = await encodeSignerBinding(sessionKey, certificate, otherCertificate)

			strictEqual(await verifySignerBinding(binding, sessionKey.coseKey, certificate), false)
		})

		it('rejects a binding signed over the certificate encoded as a CBOR byte string that embeds another certificate', async () => {
			const binding = await encodeSignerBinding(sessionKey, certificateByteString, otherCertificate)

			strictEqual(await verifySignerBinding(binding, sessionKey.coseKey, certificate), false)
		})

		it('rejects a binding that embeds the certificate in a form other than the signed form', async () => {
			const binding = await encodeSignerBinding(sessionKey, certificate, certificateByteString)

			strictEqual(await verifySignerBinding(binding, sessionKey.coseKey, certificate), false)
		})
	})
})
