import { computeBmffHash } from '../../src/bmff/computeBmffHash.ts'
import { ok, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

function buildMinimalBox(type: string, payload: Uint8Array = new Uint8Array(0)): Uint8Array {
	const size = 8 + payload.length
	const box = new Uint8Array(size)
	const view = new DataView(box.buffer)
	view.setUint32(0, size, false)
	box[4] = type.charCodeAt(0)
	box[5] = type.charCodeAt(1)
	box[6] = type.charCodeAt(2)
	box[7] = type.charCodeAt(3)
	box.set(payload, 8)
	return box
}

describe('computeBmffHash', () => {
	// #region example
	it('returns a SHA-256 hash for a minimal segment', async () => {
		const segment = buildMinimalBox('moof')
		const hash = await computeBmffHash(segment)
		ok(hash instanceof Uint8Array)
		strictEqual(hash.length, 32)
	})
	// #endregion example

	it('excludes boxes matching the exclusion list', async () => {
		const moof = buildMinimalBox('moof')
		const emsg = buildMinimalBox('emsg')
		const segment = new Uint8Array(moof.length + emsg.length)
		segment.set(moof, 0)
		segment.set(emsg, moof.length)

		const hashWithout = await computeBmffHash(segment, { exclusions: [{ xpath: '/emsg' }] })
		const hashWith = await computeBmffHash(segment)

		ok(hashWithout.length === 32)
		ok(!hashWithout.every((b: number, i: number) => b === hashWith[i]), 'hashes should differ when a box is excluded')
	})

	it('produces different hashes with and without offset prefix', async () => {
		const segment = buildMinimalBox('moof')
		const hashNoPrefix = await computeBmffHash(segment, { offsetPrefixSize: 0 })
		const hashWithPrefix = await computeBmffHash(segment, { offsetPrefixSize: 8 })
		ok(!hashNoPrefix.every((b: number, i: number) => b === hashWithPrefix[i]))
	})

	it('returns empty hash for empty segment', async () => {
		const hash = await computeBmffHash(new Uint8Array(0))
		ok(hash instanceof Uint8Array)
		strictEqual(hash.length, 32)
	})
})
