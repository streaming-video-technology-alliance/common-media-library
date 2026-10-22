import { computeBmffHash } from '../../src/bmff/computeBmffHash.ts'
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { buildLargesizeBox, concatBytes, encodeBoxOffset, sha256 } from '../merkle/merkleTestUtils.ts'

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

	describe('root box headers (ISO/IEC 14496-12 section 4.2)', () => {
		const TEXT_ENCODER = new TextEncoder()
		const ftyp = buildMinimalBox('ftyp', TEXT_ENCODER.encode('isom'))
		const moovPayload = TEXT_ENCODER.encode('moov payload')
		const largesizeMoov = buildLargesizeBox('moov', moovPayload)
		const free = buildMinimalBox('free')

		// A box whose size field is 0 extends to the end of the data.
		function buildBoxToEnd(type: string, payload: Uint8Array): Uint8Array {
			const box = buildMinimalBox(type, payload)
			new DataView(box.buffer).setUint32(0, 0, false)
			return box
		}

		// The §18.6.2 hash input: the 8-byte offset of each root box followed by the box bytes.
		async function expectedHash(boxes: readonly (readonly [offset: number, bytes: Uint8Array])[]): Promise<Uint8Array> {
			return sha256(concatBytes(...boxes.flatMap(([offset, bytes]) => [encodeBoxOffset(offset), bytes])))
		}

		it('hashes a root box with a largesize header', async () => {
			const segment = concatBytes(ftyp, largesizeMoov)

			const hash = await computeBmffHash(segment, { offsetPrefixSize: 8 })

			deepStrictEqual(hash, await expectedHash([[0, ftyp], [ftyp.length, largesizeMoov]]))
		})

		it('hashes a last root box with a size of 0 to the end of the segment', async () => {
			const moof = buildMinimalBox('moof')
			const mdat = buildBoxToEnd('mdat', TEXT_ENCODER.encode('sample data'))
			const segment = concatBytes(moof, mdat)

			const hash = await computeBmffHash(segment, { offsetPrefixSize: 8 })

			deepStrictEqual(hash, await expectedHash([[0, moof], [moof.length, mdat]]))
		})

		it('excludes a largesize box by xpath', async () => {
			const segment = concatBytes(ftyp, largesizeMoov, free)

			const hash = await computeBmffHash(segment, { exclusions: [{ xpath: '/moov' }], offsetPrefixSize: 8 })

			deepStrictEqual(hash, await expectedHash([[0, ftyp], [ftyp.length + largesizeMoov.length, free]]))
		})

		// The data offsets of an exclusion count from the start of the box header, so the payload of a largesize box starts at 16.
		it('matches a data constraint at the first payload byte of a largesize box', async () => {
			const segment = concatBytes(ftyp, largesizeMoov, free)
			const freeOffset = ftyp.length + largesizeMoov.length
			const matching = [{ xpath: '/moov', data: [{ offset: 16, value: moovPayload.subarray(0, 4) }] }]
			const other = [{ xpath: '/moov', data: [{ offset: 16, value: TEXT_ENCODER.encode('mvhd') }] }]

			const hashWithMatch = await computeBmffHash(segment, { exclusions: matching, offsetPrefixSize: 8 })
			const hashWithoutMatch = await computeBmffHash(segment, { exclusions: other, offsetPrefixSize: 8 })

			deepStrictEqual(hashWithMatch, await expectedHash([[0, ftyp], [freeOffset, free]]))
			deepStrictEqual(hashWithoutMatch, await expectedHash([[0, ftyp], [ftyp.length, largesizeMoov], [freeOffset, free]]))
		})

		// A malformed header stops the walk. The hash covers the boxes before the malformed box.
		for (const [description, largesize] of [
			['runs past the end of the segment', 1000],
			['is below the 16-byte header size', 15],
			['is above Number.MAX_SAFE_INTEGER', 2 ** 53],
		] as const) {
			it(`stops at a root box whose largesize ${description}`, async () => {
				const moov = buildLargesizeBox('moov', moovPayload, largesize)
				const segment = concatBytes(ftyp, moov, free)

				const hash = await computeBmffHash(segment, { offsetPrefixSize: 8 })

				deepStrictEqual(hash, await expectedHash([[0, ftyp]]))
			})
		}
	})
})
