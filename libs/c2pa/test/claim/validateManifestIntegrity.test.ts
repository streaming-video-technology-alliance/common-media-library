import { C2paStatusCode } from '@svta/cml-c2pa'
import { validateManifestIntegrity } from '../../src/claim/validateManifestIntegrity.ts'
import { readC2paManifest } from '../../src/readC2paManifest.ts'
import type { InternalManifestData } from '../../src/claim/InternalManifestData.ts'
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { readFileSync } from 'node:fs'
import { before, describe, it } from 'node:test'
import { createTestSigner, type TestSigner } from '../testSigner.ts'

function loadFixture(name: string): Uint8Array {
	return new Uint8Array(readFileSync(new URL(`../fixtures/${name}`, import.meta.url)))
}

const EMPTY_CLAIM_CBOR = new Uint8Array([0xa0])

function internalData(overrides: Partial<InternalManifestData>): InternalManifestData {
	return {
		manifest: {
			label: 'test',
			instanceId: null,
			claimGenerator: null,
			signatureInfo: { issuer: null, certNotBefore: null },
			assertions: [],
		},
		claimAssertionRefs: [],
		claimCborBytes: EMPTY_CLAIM_CBOR,
		signatureBytes: null,
		assertions: [],
		...overrides,
	}
}

describe('validateManifestIntegrity', () => {
	let signer: TestSigner

	before(async () => {
		signer = await createTestSigner()
	})

	// #region example
	it('returns no codes for a signed manifest with no claim refs', async () => {
		const signatureBytes = await signer.sign(EMPTY_CLAIM_CBOR)

		const { codes, certificate } = await validateManifestIntegrity(internalData({ signatureBytes }))

		strictEqual(codes.length, 0)
		deepStrictEqual(certificate, signer.certificateDER)
	})
	// #endregion example

	it('reports errors from real init segment fixture', async () => {
		const initBytes = loadFixture('init_signed_with_session_keys.m4s')

		const { codes } = await validateManifestIntegrity(readC2paManifest(initBytes))

		// The fixture has known generator-side bugs, so we expect errors
		ok(Array.isArray(codes), 'codes should be an array')

		// Verify the codes are valid C2paStatusCode values
		const validCodes = new Set([
			C2paStatusCode.ASSERTION_HASHEDURI_MISMATCH,
			C2paStatusCode.ASSERTION_MISSING,
			C2paStatusCode.ASSERTION_ACTION_INGREDIENT_MISMATCH,
			C2paStatusCode.CLAIM_SIGNATURE_MISMATCH,
		])
		for (const code of codes) {
			ok(validCodes.has(code), `unexpected code: ${code}`)
		}
	})

	it('reports CLAIM_SIGNATURE_MISSING when the manifest has no signature box', async () => {
		const { codes, certificate } = await validateManifestIntegrity(internalData({ signatureBytes: null }))

		ok(codes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISSING))
		strictEqual(codes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISMATCH), false)
		strictEqual(certificate, null)
	})

	it('reports CLAIM_SIGNATURE_MISMATCH when the signature carries no certificate', async () => {
		// COSE_Sign1 with an empty protected header, so there is no x5chain to verify against
		const signatureBytes = new Uint8Array([0x84, 0x40, 0xa0, 0x40, 0x40])

		const { codes } = await validateManifestIntegrity(internalData({ signatureBytes }))

		ok(codes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISMATCH))
		strictEqual(codes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISSING), false)
	})

	it('reports CLAIM_SIGNATURE_MISMATCH when the signature does not verify over the claim', async () => {
		const signatureBytes = await signer.sign(new Uint8Array([0xa1, 0x61, 0x61, 0x01]))

		const { codes } = await validateManifestIntegrity(internalData({ signatureBytes }))

		ok(codes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISMATCH))
	})

	it('reports CLAIM_MISSING when the manifest has no claim box', async () => {
		const signatureBytes = await signer.sign(EMPTY_CLAIM_CBOR)

		const { codes } = await validateManifestIntegrity(internalData({ claimCborBytes: null, signatureBytes }))

		ok(codes.includes(C2paStatusCode.CLAIM_MISSING))
	})
})
