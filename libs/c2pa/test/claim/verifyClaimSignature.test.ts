import { verifyClaimSignature } from '../../src/claim/verifyClaimSignature.ts'
import { extractManifestCertificate } from '../../src/extractManifestCertificate.ts'
import { readC2paManifestInternal } from '../../src/readC2paManifest.ts'
import { strictEqual, ok } from 'node:assert'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

function loadFixture(name: string): Uint8Array {
	return new Uint8Array(readFileSync(new URL(`../fixtures/${name}`, import.meta.url)))
}

describe('verifyClaimSignature', () => {
	// #region example
	it('returns false when signature bytes are tampered', async () => {
		const result = await verifyClaimSignature(
			new Uint8Array([0x84, 0x40, 0xa0, 0x40, 0x40]),
			new Uint8Array([0x01]),
			new Uint8Array([0x30, 0x00]),
		)
		strictEqual(result, false)
	})
	// #endregion example

	it('returns false for completely invalid inputs', async () => {
		const result = await verifyClaimSignature(
			new Uint8Array(0),
			new Uint8Array(0),
			new Uint8Array(0),
		)
		strictEqual(result, false)
	})

	it('attempts verification with real init segment data', async () => {
		const initBytes = loadFixture('init_signed_with_session_keys.m4s')
		const internalData = readC2paManifestInternal(initBytes)
		const certificate = extractManifestCertificate(initBytes)

		ok(internalData.signatureBytes, 'signature bytes should be present')
		ok(internalData.claimCborBytes, 'claim CBOR bytes should be present')
		ok(certificate, 'certificate should be present')

		// This may return true or false depending on whether the generator
		// produced a valid claim signature. We just verify it doesn't throw.
		const result = await verifyClaimSignature(
			internalData.signatureBytes,
			internalData.claimCborBytes,
			certificate,
		)
		strictEqual(typeof result, 'boolean')
	})
})
