import { C2paStatusCode } from '@svta/cml-c2pa'
import { validateAssertionHashes } from '../../src/claim/validateAssertionHashes.ts'
import type { ClaimAssertionRef } from '../../src/claim/ClaimAssertionRef.ts'
import type { InternalAssertionData } from '../../src/claim/InternalManifestData.ts'
import { deepStrictEqual, strictEqual } from 'node:assert'
import { describe, it } from 'vite-plus/test'

async function sha256(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', data))
}

function makeAssertion(label: string, payload: Uint8Array): InternalAssertionData {
	return { label, data: {}, rawBoxPayload: payload }
}

describe('validateAssertionHashes', () => {
	// #region example
	it('returns no codes and the verified assertion when all hashes match', async () => {
		const payload = new Uint8Array([0x01, 0x02, 0x03])
		const hash = await sha256(payload)

		const refs: ClaimAssertionRef[] = [
			{ url: 'self#jumbf=/c2pa/manifest/c2pa.assertions/c2pa.hash.bmff.v3', hash, alg: null },
		]
		const assertions = [makeAssertion('c2pa.hash.bmff.v3', payload)]

		const { codes, verified } = await validateAssertionHashes(refs, assertions)
		deepStrictEqual(codes, [])
		deepStrictEqual(
			verified.map(a => a.label),
			['c2pa.hash.bmff.v3'],
		)
	})
	// #endregion example

	it('returns empty results when no claim refs exist', async () => {
		const { codes, verified } = await validateAssertionHashes([], [])
		deepStrictEqual(codes, [])
		deepStrictEqual(verified, [])
	})

	it('reports ASSERTION_MISSING when referenced assertion is absent', async () => {
		const refs: ClaimAssertionRef[] = [
			{
				url: 'self#jumbf=/c2pa/manifest/c2pa.assertions/cawg.metadata',
				hash: new Uint8Array(32),
				alg: null,
			},
		]

		const { codes, verified } = await validateAssertionHashes(refs, [])
		deepStrictEqual(codes, [C2paStatusCode.ASSERTION_MISSING])
		deepStrictEqual(verified, [])
	})

	it('reports ASSERTION_MISSING and verifies nothing when the label is ambiguous', async () => {
		const payload = new Uint8Array([0x01, 0x02, 0x03])
		const hash = await sha256(payload)

		// Two boxes share the referenced label, so §8.4.1 makes the reference unresolved.
		const refs: ClaimAssertionRef[] = [
			{ url: 'self#jumbf=/c2pa/manifest/c2pa.assertions/c2pa.session-keys', hash, alg: null },
		]
		const assertions = [
			makeAssertion('c2pa.session-keys', payload),
			makeAssertion('c2pa.session-keys', payload),
		]

		const { codes, verified } = await validateAssertionHashes(refs, assertions)
		deepStrictEqual(codes, [C2paStatusCode.ASSERTION_MISSING])
		deepStrictEqual(verified, [])
	})

	it('reports ASSERTION_HASHEDURI_MISMATCH when hash does not match', async () => {
		const payload = new Uint8Array([0x01, 0x02, 0x03])
		const wrongHash = new Uint8Array(32).fill(0xff)

		const refs: ClaimAssertionRef[] = [
			{
				url: 'self#jumbf=/c2pa/manifest/c2pa.assertions/c2pa.hash.bmff.v3',
				hash: wrongHash,
				alg: null,
			},
		]
		const assertions = [makeAssertion('c2pa.hash.bmff.v3', payload)]

		const { codes, verified } = await validateAssertionHashes(refs, assertions)
		deepStrictEqual(codes, [C2paStatusCode.ASSERTION_HASHEDURI_MISMATCH])
		deepStrictEqual(verified, [])
	})

	it('reports multiple errors for multiple failing refs', async () => {
		const payload = new Uint8Array([0xaa, 0xbb])
		const wrongHash = new Uint8Array(32).fill(0x00)

		const refs: ClaimAssertionRef[] = [
			{
				url: 'self#jumbf=/c2pa/manifest/c2pa.assertions/cawg.identity',
				hash: new Uint8Array(32),
				alg: null,
			},
			{
				url: 'self#jumbf=/c2pa/manifest/c2pa.assertions/c2pa.hash.bmff.v3',
				hash: wrongHash,
				alg: null,
			},
		]
		const assertions = [makeAssertion('c2pa.hash.bmff.v3', payload)]

		const { codes } = await validateAssertionHashes(refs, assertions)
		strictEqual(codes.length, 2)
		strictEqual(codes.includes(C2paStatusCode.ASSERTION_MISSING), true)
		strictEqual(codes.includes(C2paStatusCode.ASSERTION_HASHEDURI_MISMATCH), true)
	})

	it('extracts label from relative JUMBF URI', async () => {
		const payload = new Uint8Array([0x10])
		const hash = await sha256(payload)

		const refs: ClaimAssertionRef[] = [
			{ url: 'c2pa.assertions/c2pa.session-keys', hash, alg: null },
		]
		const assertions = [makeAssertion('c2pa.session-keys', payload)]

		const { codes } = await validateAssertionHashes(refs, assertions)
		deepStrictEqual(codes, [])
	})

	it('respects explicit alg field in claim ref', async () => {
		const payload = new Uint8Array([0x42])
		const hash = await sha256(payload)

		const refs: ClaimAssertionRef[] = [
			{ url: 'self#jumbf=/c2pa/m/c2pa.assertions/test', hash, alg: 'sha256' },
		]
		const assertions = [makeAssertion('test', payload)]

		const { codes } = await validateAssertionHashes(refs, assertions)
		deepStrictEqual(codes, [])
	})
})
