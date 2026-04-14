import { C2paStatusCode } from '@svta/cml-c2pa'
import { validateAssertionHashes } from '../../src/claim/validateAssertionHashes.ts'
import type { ClaimAssertionRef } from '../../src/claim/ClaimAssertionRef.ts'
import type { InternalAssertionData } from '../../src/claim/InternalManifestData.ts'
import { deepStrictEqual, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

async function sha256(data: Uint8Array): Promise<Uint8Array> {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', data))
}

function makeAssertion(label: string, payload: Uint8Array): InternalAssertionData {
	return { label, data: {}, rawBoxPayload: payload }
}

describe('validateAssertionHashes', () => {
	// #region example
	it('returns empty array when all assertion hashes match', async () => {
		const payload = new Uint8Array([0x01, 0x02, 0x03])
		const hash = await sha256(payload)

		const refs: ClaimAssertionRef[] = [
			{ url: 'self#jumbf=/c2pa/manifest/c2pa.assertions/c2pa.hash.bmff.v3', hash, alg: null },
		]
		const assertions = [makeAssertion('c2pa.hash.bmff.v3', payload)]

		const codes = await validateAssertionHashes(refs, assertions)
		deepStrictEqual(codes, [])
	})
	// #endregion example

	it('returns empty array when no claim refs exist', async () => {
		const codes = await validateAssertionHashes([], [])
		deepStrictEqual(codes, [])
	})

	it('reports ASSERTION_MISSING when referenced assertion is absent', async () => {
		const refs: ClaimAssertionRef[] = [
			{ url: 'self#jumbf=/c2pa/manifest/c2pa.assertions/cawg.metadata', hash: new Uint8Array(32), alg: null },
		]

		const codes = await validateAssertionHashes(refs, [])
		deepStrictEqual(codes, [C2paStatusCode.ASSERTION_MISSING])
	})

	it('reports ASSERTION_HASHEDURI_MISMATCH when hash does not match', async () => {
		const payload = new Uint8Array([0x01, 0x02, 0x03])
		const wrongHash = new Uint8Array(32).fill(0xff)

		const refs: ClaimAssertionRef[] = [
			{ url: 'self#jumbf=/c2pa/manifest/c2pa.assertions/c2pa.hash.bmff.v3', hash: wrongHash, alg: null },
		]
		const assertions = [makeAssertion('c2pa.hash.bmff.v3', payload)]

		const codes = await validateAssertionHashes(refs, assertions)
		deepStrictEqual(codes, [C2paStatusCode.ASSERTION_HASHEDURI_MISMATCH])
	})

	it('reports multiple errors for multiple failing refs', async () => {
		const payload = new Uint8Array([0xaa, 0xbb])
		const wrongHash = new Uint8Array(32).fill(0x00)

		const refs: ClaimAssertionRef[] = [
			{ url: 'self#jumbf=/c2pa/manifest/c2pa.assertions/cawg.identity', hash: new Uint8Array(32), alg: null },
			{ url: 'self#jumbf=/c2pa/manifest/c2pa.assertions/c2pa.hash.bmff.v3', hash: wrongHash, alg: null },
		]
		const assertions = [makeAssertion('c2pa.hash.bmff.v3', payload)]

		const codes = await validateAssertionHashes(refs, assertions)
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

		const codes = await validateAssertionHashes(refs, assertions)
		deepStrictEqual(codes, [])
	})

	it('respects explicit alg field in claim ref', async () => {
		const payload = new Uint8Array([0x42])
		const hash = await sha256(payload)

		const refs: ClaimAssertionRef[] = [
			{ url: 'self#jumbf=/c2pa/m/c2pa.assertions/test', hash, alg: 'sha256' },
		]
		const assertions = [makeAssertion('test', payload)]

		const codes = await validateAssertionHashes(refs, assertions)
		deepStrictEqual(codes, [])
	})
})
