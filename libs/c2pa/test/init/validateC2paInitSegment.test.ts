import { validateC2paInitSegment, C2paStatusCode, LiveVideoStatusCode } from '@svta/cml-c2pa'
import { deepStrictEqual, ok, rejects, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { computeBmffHash } from '../../src/bmff/computeBmffHash.ts'
import { buildInitMediaBoxes, buildMerkleInitSegment, sha256 } from '../merkle/merkleTestUtils.ts'

describe('validateC2paInitSegment', () => {
	// #region example
	it('throws for empty bytes (no C2PA UUID box)', async () => {
		await rejects(
			() => validateC2paInitSegment(new Uint8Array(0)),
			/No C2PA UUID box/,
		)
	})
	// #endregion example

	it('returns INIT_INVALID when the segment contains an mdat box', async () => {
		const ftyp = new Uint8Array([0, 0, 0, 12, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d])
		const mdat = new Uint8Array([0, 0, 0, 8, 0x6d, 0x64, 0x61, 0x74])
		const segment = new Uint8Array(ftyp.length + mdat.length)
		segment.set(ftyp, 0)
		segment.set(mdat, ftyp.length)

		const result = await validateC2paInitSegment(segment)
		strictEqual(result.isValid, false)
		strictEqual(result.manifest, null)
		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.INIT_INVALID])
	})
})

describe('validateC2paInitSegment — VOD Merkle', () => {
	const HASH = new Uint8Array(32).fill(3)

	function merkleEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
		return { uniqueId: 1, localId: 1, count: 4, hashes: [HASH], ...overrides }
	}

	it('populates merkleMaps and skips SESSIONKEY_INVALID in VOD Merkle mode', async () => {
		const init = buildMerkleInitSegment({
			exclusions: [{ xpath: '/uuid' }],
			merkle: [merkleEntry()],
		})

		const result = await validateC2paInitSegment(init)

		strictEqual(result.merkleMaps.length, 1)
		strictEqual(result.merkleMaps[0].count, 4)
		strictEqual(result.errorCodes.includes(LiveVideoStatusCode.SESSIONKEY_INVALID), false)
	})

	it('returns empty merkleMaps when the assertion has no merkle field', async () => {
		const init = buildMerkleInitSegment({ exclusions: [] })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.merkleMaps, [])
		ok(result.errorCodes.includes(LiveVideoStatusCode.SESSIONKEY_INVALID))
	})

	it('accepts a matching initHash without additional error codes', async () => {
		// /uuid is excluded, so the init hash covers only ftyp + moov — computable up front.
		// Merkle-only assertions hash with 8-byte box-offset prefixes (§18.6.2).
		const initHash = await computeBmffHash(buildInitMediaBoxes(), { offsetPrefixSize: 8 })
		const init = buildMerkleInitSegment({
			exclusions: [{ xpath: '/uuid' }],
			merkle: [merkleEntry({ initHash })],
		})

		const result = await validateC2paInitSegment(init)

		strictEqual(result.merkleMaps.length, 1)
		strictEqual(result.isValid, true)
		deepStrictEqual(result.errorCodes, [])
	})

	it('rejects a mismatching initHash', async () => {
		const wrongHash = await sha256(new Uint8Array([9, 9, 9]))
		const init = buildMerkleInitSegment({
			exclusions: [{ xpath: '/uuid' }],
			merkle: [merkleEntry({ initHash: wrongHash })],
		})

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(LiveVideoStatusCode.INIT_INVALID))
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_BMFFHASH_MISMATCH))
	})

	it('rejects an empty merkle array as malformed without flagging session keys', async () => {
		const init = buildMerkleInitSegment({ exclusions: [], merkle: [] })

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		deepStrictEqual(result.merkleMaps, [])
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED))
		strictEqual(result.errorCodes.includes(LiveVideoStatusCode.SESSIONKEY_INVALID), false)
	})
})
