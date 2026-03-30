import { computeBmffHash } from '../../src/bmff/computeBmffHash.ts'
import { validateBmffHash } from '../../src/bmff/validateBmffHash.ts'
import { ok, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

function buildMinimalBox(type: string): Uint8Array {
	const box = new Uint8Array(8)
	const view = new DataView(box.buffer)
	view.setUint32(0, 8, false)
	box[4] = type.charCodeAt(0)
	box[5] = type.charCodeAt(1)
	box[6] = type.charCodeAt(2)
	box[7] = type.charCodeAt(3)
	return box
}

describe('validateBmffHash', () => {
	// #region example
	it('returns true when hash matches with no offset prefix', async () => {
		const segment = buildMinimalBox('moof')
		const expected = await computeBmffHash(segment, { offsetPrefixSize: 0 })
		const isValid = await validateBmffHash(segment, expected)
		strictEqual(isValid, true)
	})
	// #endregion example

	it('returns true when hash matches with 8-byte offset prefix', async () => {
		const segment = buildMinimalBox('moof')
		const expected = await computeBmffHash(segment, { offsetPrefixSize: 8 })
		const isValid = await validateBmffHash(segment, expected)
		strictEqual(isValid, true)
	})

	it('returns false for an incorrect hash', async () => {
		const segment = buildMinimalBox('moof')
		const wrongHash = new Uint8Array(32).fill(0xab)
		const isValid = await validateBmffHash(segment, wrongHash)
		strictEqual(isValid, false)
	})

	it('respects exclusion options', async () => {
		const moof = buildMinimalBox('moof')
		const emsg = buildMinimalBox('emsg')
		const segment = new Uint8Array(moof.length + emsg.length)
		segment.set(moof, 0)
		segment.set(emsg, moof.length)

		const options = { exclusions: [{ xpath: '/emsg' }] }
		const expected = await computeBmffHash(segment, { ...options, offsetPrefixSize: 0 })
		ok(await validateBmffHash(segment, expected, options))
	})
})
