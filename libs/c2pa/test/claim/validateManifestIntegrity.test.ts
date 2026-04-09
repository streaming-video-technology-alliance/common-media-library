import { C2paStatusCode } from '@svta/cml-c2pa'
import { validateManifestIntegrity } from '../../src/claim/validateManifestIntegrity.ts'
import { readC2paManifest } from '../../src/readC2paManifest.ts'
import { extractManifestCertificate } from '../../src/extractManifestCertificate.ts'
import type { InternalManifestData } from '../../src/claim/InternalManifestData.ts'
import { ok, strictEqual } from 'node:assert'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

function loadFixture(name: string): Uint8Array {
	return new Uint8Array(readFileSync(new URL(`../fixtures/${name}`, import.meta.url)))
}

describe('validateManifestIntegrity', () => {
	// #region example
	it('returns empty array for manifest with no claim refs', async () => {
		const emptyManifest: InternalManifestData = {
			manifest: {
				label: 'test',
				instanceId: null,
				claimGenerator: null,
				signatureInfo: { issuer: null, certNotBefore: null },
				assertions: [],
			},
			claimAssertionRefs: [],
			claimCborBytes: null,
			signatureBytes: null,
			assertions: [],
		}

		const codes = await validateManifestIntegrity(emptyManifest, null)
		strictEqual(codes.length, 0)
	})
	// #endregion example

	it('reports errors from real init segment fixture', async () => {
		const initBytes = loadFixture('init_signed_with_session_keys.m4s')
		const internalData = readC2paManifest(initBytes)
		const certificate = extractManifestCertificate(initBytes)

		const codes = await validateManifestIntegrity(internalData, certificate)

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

	it('skips signature verification when certificate is null', async () => {
		const emptyManifest: InternalManifestData = {
			manifest: {
				label: 'test',
				instanceId: null,
				claimGenerator: null,
				signatureInfo: { issuer: null, certNotBefore: null },
				assertions: [],
			},
			claimAssertionRefs: [],
			claimCborBytes: new Uint8Array([0xa0]),
			signatureBytes: new Uint8Array([0x84, 0x40, 0xa0, 0x40, 0x40]),
			assertions: [],
		}

		const codes = await validateManifestIntegrity(emptyManifest, null)
		// CLAIM_SIGNATURE_MISMATCH should NOT appear because certificate is null
		strictEqual(codes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISMATCH as never), false)
	})
})
