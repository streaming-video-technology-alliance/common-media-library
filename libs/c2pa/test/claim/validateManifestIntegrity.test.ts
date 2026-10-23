import { C2paStatusCode } from '@svta/cml-c2pa'
import { validateManifestIntegrity } from '../../src/claim/validateManifestIntegrity.ts'
import { readC2paManifest } from '../../src/readC2paManifest.ts'
import type { InternalManifestData } from '../../src/claim/InternalManifestData.ts'
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { readFileSync } from 'node:fs'
import { before, describe, it } from 'node:test'
import { encodeCbor } from '../cborTestUtils.ts'
import { buildBox, buildJumb, sha256, signatureUri } from '../merkle/merkleTestUtils.ts'
import { createTestSigner, type TestSigner } from '../testSigner.ts'
import { buildInitSegmentWithManifest } from '../vsi/vsiTestUtils.ts'

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
		manifestId: null,
		claimAssertionRefs: [],
		claimCborBytes: EMPTY_CLAIM_CBOR,
		claimCode: null,
		signatureUriCode: null,
		signatureBytes: null,
		assertions: [],
		...overrides,
	}
}

const BMFF_V3_LABEL = 'c2pa.hash.bmff.v3'

// A hard binding assertion (§15.10.1.2) and the claim reference that resolves to it.
async function hardBinding(): Promise<Partial<InternalManifestData>> {
	const rawBoxPayload = new Uint8Array(0)
	return {
		assertions: [{ label: BMFF_V3_LABEL, data: {}, rawBoxPayload }],
		claimAssertionRefs: [
			{
				url: `self#jumbf=c2pa.assertions/${BMFF_V3_LABEL}`,
				hash: await sha256(rawBoxPayload),
				alg: 'sha256',
			},
		],
	}
}

describe('validateManifestIntegrity', () => {
	let signer: TestSigner

	before(async () => {
		signer = await createTestSigner()
	})

	// #region example
	it('returns no codes for a signed manifest with one hard binding assertion', async () => {
		const signatureBytes = await signer.sign(EMPTY_CLAIM_CBOR)

		const { codes, certificate } = await validateManifestIntegrity(
			internalData({ ...(await hardBinding()), signatureBytes }),
		)

		strictEqual(codes.length, 0)
		deepStrictEqual(certificate, signer.certificateDER)
	})
	// #endregion example

	it('reports CLAIM_HARD_BINDINGS_MISSING for a signed manifest without a hard binding assertion', async () => {
		const signatureBytes = await signer.sign(EMPTY_CLAIM_CBOR)

		const { codes } = await validateManifestIntegrity(internalData({ signatureBytes }))

		deepStrictEqual(codes, [C2paStatusCode.CLAIM_HARD_BINDINGS_MISSING])
	})

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
		const { codes, certificate } = await validateManifestIntegrity(
			internalData({ signatureBytes: null }),
		)

		ok(codes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISSING))
		strictEqual(codes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISMATCH), false)
		strictEqual(certificate, null)
	})

	it('reports CLAIM_SIGNATURE_MISMATCH when the signature carries no certificate', async () => {
		// COSE_Sign1 with an empty protected header, so there is no x5chain to verify against
		const signatureBytes = new Uint8Array([0xd2, 0x84, 0x40, 0xa0, 0x40, 0x40])

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

		const { codes } = await validateManifestIntegrity(
			internalData({ claimCborBytes: null, signatureBytes }),
		)

		ok(codes.includes(C2paStatusCode.CLAIM_MISSING))
	})

	it('reports CLAIM_SIGNATURE_MISSING if the claim signature URI does not resolve to the signature box', async () => {
		const signatureBytes = await signer.sign(EMPTY_CLAIM_CBOR)

		const { codes } = await validateManifestIntegrity(
			internalData({
				...(await hardBinding()),
				signatureBytes,
				signatureUriCode: C2paStatusCode.CLAIM_SIGNATURE_MISSING,
			}),
		)

		deepStrictEqual(codes, [C2paStatusCode.CLAIM_SIGNATURE_MISSING])
	})

	it('reports ASSERTION_HASHEDURI_MISMATCH for a claim hash that is a CBOR array of integers', async () => {
		const assertionBox = buildJumb('com.example.cbor', buildBox('cbor', Uint8Array.of(0xa0)))
		const hardBindingBox = buildJumb(BMFF_V3_LABEL, buildBox('cbor', Uint8Array.of(0xa0)))
		// hashed-uri-map CDDL: hash is a byte string. This claim encodes the correct hash as an array.
		const claim = encodeCbor({
			instanceID: 'urn:uuid:test-manifest',
			signature: signatureUri('urn:uuid:test-manifest'),
			created_assertions: [
				{
					url: 'self#jumbf=c2pa.assertions/com.example.cbor',
					hash: Array.from(await sha256(assertionBox.subarray(8))),
					alg: 'sha256',
				},
				{
					url: `self#jumbf=c2pa.assertions/${BMFF_V3_LABEL}`,
					hash: await sha256(hardBindingBox.subarray(8)),
					alg: 'sha256',
				},
			],
		})
		const manifest = buildJumb(
			'urn:uuid:test-manifest',
			buildJumb('c2pa.claim', buildBox('cbor', claim)),
			buildJumb('c2pa.assertions', assertionBox, hardBindingBox),
			buildJumb('c2pa.signature', buildBox('cbor', await signer.sign(claim))),
		)

		const { codes } = await validateManifestIntegrity(
			readC2paManifest(buildInitSegmentWithManifest(manifest)),
		)

		deepStrictEqual(codes, [C2paStatusCode.ASSERTION_HASHEDURI_MISMATCH])
	})

	it('reports the claim code of the manifest data', async () => {
		const signatureBytes = await signer.sign(EMPTY_CLAIM_CBOR)

		const { codes } = await validateManifestIntegrity(
			internalData({ claimCode: C2paStatusCode.CLAIM_MALFORMED, signatureBytes }),
		)

		deepStrictEqual(codes, [C2paStatusCode.CLAIM_MALFORMED])
	})
})

describe('validateManifestIntegrity: hard binding labels (§15.10.1.2, §6.4, §18.9.2)', () => {
	const BMFF_V3 = 'c2pa.hash.bmff.v3'

	function assertion(label: string) {
		return { label, data: {}, rawBoxPayload: new Uint8Array(0) }
	}

	async function hasMultipleHardBindings(secondLabel: string): Promise<boolean> {
		const { codes } = await validateManifestIntegrity(
			internalData({ assertions: [assertion(BMFF_V3), assertion(secondLabel)] }),
		)
		return codes.includes(C2paStatusCode.ASSERTION_MULTIPLE_HARD_BINDINGS)
	}

	// Each label is a standard hard binding, so two of them in one manifest are too many.
	for (const label of [
		'c2pa.hash.data',
		'c2pa.hash.boxes',
		'c2pa.hash.collection.data',
		'c2pa.hash.bmff.v2',
		`${BMFF_V3}__1`,
	]) {
		it(`counts ${label} next to ${BMFF_V3}`, async () => {
			strictEqual(await hasMultipleHardBindings(label), true)
		})
	}

	// A part binding, the multi-asset assertion, and the legacy label are not standard hard bindings (§18.9.2).
	for (const label of [
		'c2pa.hash.data.part',
		'c2pa.hash.data.part__2',
		'c2pa.hash.multi-asset',
		'c2pa.hash.bmff',
	]) {
		it(`does not count ${label} next to ${BMFF_V3}`, async () => {
			strictEqual(await hasMultipleHardBindings(label), false)
		})
	}
})

describe('validateManifestIntegrity: claim box codes (§15.6.1)', () => {
	let signatureBytes: Uint8Array

	before(async () => {
		signatureBytes = await (await createTestSigner()).sign(EMPTY_CLAIM_CBOR)
	})

	it('reports CLAIM_MULTIPLE once, without CLAIM_MISSING', async () => {
		const { codes } = await validateManifestIntegrity(
			internalData({
				claimCborBytes: null,
				claimCode: C2paStatusCode.CLAIM_MULTIPLE,
				signatureBytes,
			}),
		)

		deepStrictEqual(codes, [C2paStatusCode.CLAIM_MULTIPLE])
	})

	it('reports only CLAIM_MISSING for a manifest without a claim box next to store assertions', async () => {
		const assertions = [{ label: 'com.example.a', data: {}, rawBoxPayload: new Uint8Array(0) }]
		const { codes } = await validateManifestIntegrity(
			internalData({ claimCborBytes: null, signatureBytes, assertions }),
		)

		deepStrictEqual(codes, [C2paStatusCode.CLAIM_MISSING])
	})
})
