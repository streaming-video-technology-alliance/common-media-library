import { computeBmffHash } from '../../src/bmff/computeBmffHash.ts'
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import {
	buildBox,
	buildLargesizeBox,
	concatBytes,
	encodeBoxOffset,
	sha256,
} from '../merkle/merkleTestUtils.ts'

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
		ok(
			!hashWithout.every((b: number, i: number) => b === hashWith[i]),
			'hashes should differ when a box is excluded',
		)
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
		async function expectedHash(
			boxes: readonly (readonly [offset: number, bytes: Uint8Array])[],
		): Promise<Uint8Array> {
			return sha256(
				concatBytes(...boxes.flatMap(([offset, bytes]) => [encodeBoxOffset(offset), bytes])),
			)
		}

		it('hashes a root box with a largesize header', async () => {
			const segment = concatBytes(ftyp, largesizeMoov)

			const hash = await computeBmffHash(segment, { offsetPrefixSize: 8 })

			deepStrictEqual(
				hash,
				await expectedHash([
					[0, ftyp],
					[ftyp.length, largesizeMoov],
				]),
			)
		})

		it('hashes a last root box with a size of 0 to the end of the segment', async () => {
			const moof = buildMinimalBox('moof')
			const mdat = buildBoxToEnd('mdat', TEXT_ENCODER.encode('sample data'))
			const segment = concatBytes(moof, mdat)

			const hash = await computeBmffHash(segment, { offsetPrefixSize: 8 })

			deepStrictEqual(
				hash,
				await expectedHash([
					[0, moof],
					[moof.length, mdat],
				]),
			)
		})

		it('excludes a largesize box by xpath', async () => {
			const segment = concatBytes(ftyp, largesizeMoov, free)

			const hash = await computeBmffHash(segment, {
				exclusions: [{ xpath: '/moov' }],
				offsetPrefixSize: 8,
			})

			deepStrictEqual(
				hash,
				await expectedHash([
					[0, ftyp],
					[ftyp.length + largesizeMoov.length, free],
				]),
			)
		})

		// The data offsets of an exclusion count from the start of the box header, so the payload of a largesize box starts at 16.
		it('matches a data constraint at the first payload byte of a largesize box', async () => {
			const segment = concatBytes(ftyp, largesizeMoov, free)
			const freeOffset = ftyp.length + largesizeMoov.length
			const matching = [
				{ xpath: '/moov', data: [{ offset: 16, value: moovPayload.subarray(0, 4) }] },
			]
			const other = [{ xpath: '/moov', data: [{ offset: 16, value: TEXT_ENCODER.encode('mvhd') }] }]

			const hashWithMatch = await computeBmffHash(segment, {
				exclusions: matching,
				offsetPrefixSize: 8,
			})
			const hashWithoutMatch = await computeBmffHash(segment, {
				exclusions: other,
				offsetPrefixSize: 8,
			})

			deepStrictEqual(
				hashWithMatch,
				await expectedHash([
					[0, ftyp],
					[freeOffset, free],
				]),
			)
			deepStrictEqual(
				hashWithoutMatch,
				await expectedHash([
					[0, ftyp],
					[ftyp.length, largesizeMoov],
					[freeOffset, free],
				]),
			)
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

	// §18.6.2: an xpath names the box at that path. A root box that is not excluded in its entirety
	// contributes offset || data, where data is the box bytes minus the excluded ranges.
	describe('nested exclusions and subsets (§18.6.2)', () => {
		const TEXT_ENCODER = new TextEncoder()
		const BOX_HEADER_SIZE = 8
		const ftyp = buildBox('ftyp', TEXT_ENCODER.encode('isom'))
		const mvhd = buildBox('mvhd', TEXT_ENCODER.encode('mvhd payload'))
		const udta = buildBox('udta', TEXT_ENCODER.encode('udta payload'))
		const moov = buildBox('moov', concatBytes(mvhd, udta))
		const moovHeader = moov.subarray(0, BOX_HEADER_SIZE)
		const segment = concatBytes(ftyp, moov)

		// The hash input, part by part: the 8-byte offset of a root box, then the kept bytes of the box.
		async function expectedHash(...parts: readonly Uint8Array[]): Promise<Uint8Array> {
			return sha256(concatBytes(...parts))
		}

		it('excludes a nested box and keeps the rest of the root box with its offset', async () => {
			const hash = await computeBmffHash(segment, {
				exclusions: [{ xpath: '/moov/udta' }],
				offsetPrefixSize: 8,
			})

			deepStrictEqual(
				hash,
				await expectedHash(
					encodeBoxOffset(0),
					ftyp,
					encodeBoxOffset(ftyp.length),
					moovHeader,
					mvhd,
				),
			)
		})

		it('omits the offset of a root box with a nested exclusion when offsetPrefixSize is 0', async () => {
			const hash = await computeBmffHash(segment, {
				exclusions: [{ xpath: '/moov/udta' }],
				offsetPrefixSize: 0,
			})

			deepStrictEqual(hash, await expectedHash(ftyp, moovHeader, mvhd))
		})

		it('selects a nested box by the index of its parent', async () => {
			const trak1 = buildBox(
				'trak',
				concatBytes(buildBox('tkhd', Uint8Array.of(1)), buildBox('udta', Uint8Array.of(1))),
			)
			const tkhd2 = buildBox('tkhd', Uint8Array.of(2))
			const trak2 = buildBox('trak', concatBytes(tkhd2, buildBox('udta', Uint8Array.of(2))))
			const moov = buildBox('moov', concatBytes(mvhd, trak1, trak2))
			const segment = concatBytes(ftyp, moov)

			const hash = await computeBmffHash(segment, {
				exclusions: [{ xpath: '/moov/trak[2]/udta' }],
				offsetPrefixSize: 8,
			})

			deepStrictEqual(
				hash,
				await expectedHash(
					encodeBoxOffset(0),
					ftyp,
					encodeBoxOffset(ftyp.length),
					moov.subarray(0, BOX_HEADER_SIZE),
					mvhd,
					trak1,
					trak2.subarray(0, BOX_HEADER_SIZE),
					tkhd2,
				),
			)
		})

		it('excludes only the root box with the index of the xpath', async () => {
			const uuid1 = buildBox('uuid', Uint8Array.of(1))
			const uuid2 = buildBox('uuid', Uint8Array.of(2))
			const free = buildBox('free')
			const segment = concatBytes(uuid1, uuid2, free)

			const hash = await computeBmffHash(segment, {
				exclusions: [{ xpath: '/uuid[2]' }],
				offsetPrefixSize: 8,
			})

			deepStrictEqual(
				hash,
				await expectedHash(
					encodeBoxOffset(0),
					uuid1,
					encodeBoxOffset(uuid1.length + uuid2.length),
					free,
				),
			)
		})

		describe('subset of a root box', () => {
			const payload = Uint8Array.from({ length: 24 }, (_, i) => i)
			const moov = buildBox('moov', payload)
			const segment = concatBytes(ftyp, moov)

			// Subset offsets count from the start of the box header. A length of 0 runs to the end of the box.
			// Bytes beyond the end of the box are never hashed.
			for (const [description, subset, kept] of [
				[
					'two ranges, the last one to the end of the box',
					[
						{ offset: 8, length: 4 },
						{ offset: 20, length: 0 },
					],
					[moov.subarray(0, 8), moov.subarray(12, 20)],
				],
				[
					'a range that runs past the end of the box',
					[{ offset: 24, length: 100 }],
					[moov.subarray(0, 24)],
				],
				['a range that starts past the end of the box', [{ offset: 40, length: 4 }], [moov]],
			] as const) {
				it(`keeps the offset and the bytes outside ${description}`, async () => {
					const hash = await computeBmffHash(segment, {
						exclusions: [{ xpath: '/moov', subset }],
						offsetPrefixSize: 8,
					})

					deepStrictEqual(
						hash,
						await expectedHash(encodeBoxOffset(0), ftyp, encodeBoxOffset(ftyp.length), ...kept),
					)
				})
			}
		})

		it('counts each byte once when the ranges of two exclusions overlap', async () => {
			const exclusions = [
				{ xpath: '/moov', subset: [{ offset: 8, length: 8 }] },
				{ xpath: '/moov/mvhd' },
			]

			const hash = await computeBmffHash(segment, { exclusions, offsetPrefixSize: 8 })

			deepStrictEqual(
				hash,
				await expectedHash(
					encodeBoxOffset(0),
					ftyp,
					encodeBoxOffset(ftyp.length),
					moovHeader,
					udta,
				),
			)
		})

		it('narrows a nested exclusion with a data constraint', async () => {
			const udta1 = buildBox('udta', TEXT_ENCODER.encode('u1'))
			const udta2 = buildBox('udta', TEXT_ENCODER.encode('u2'))
			const moov = buildBox('moov', concatBytes(udta1, udta2))
			const segment = concatBytes(ftyp, moov)
			const exclusions = [
				{ xpath: '/moov/udta', data: [{ offset: 8, value: TEXT_ENCODER.encode('u2') }] },
			]

			const hash = await computeBmffHash(segment, { exclusions, offsetPrefixSize: 8 })

			deepStrictEqual(
				hash,
				await expectedHash(
					encodeBoxOffset(0),
					ftyp,
					encodeBoxOffset(ftyp.length),
					moov.subarray(0, BOX_HEADER_SIZE),
					udta1,
				),
			)
		})

		it('excludes nothing for a nested xpath through a box whose payload is not a box list', async () => {
			const mdat = buildBox(
				'mdat',
				Uint8Array.of(0xff, 0xff, 0xff, 0xff, 0x78, 0x78, 0x78, 0x78, 1),
			)
			const segment = concatBytes(ftyp, mdat)

			const hash = await computeBmffHash(segment, {
				exclusions: [{ xpath: '/mdat/xxxx' }],
				offsetPrefixSize: 8,
			})

			deepStrictEqual(
				hash,
				await expectedHash(encodeBoxOffset(0), ftyp, encodeBoxOffset(ftyp.length), mdat),
			)
		})

		// A uuid box puts a 16-byte usertype before its children (ISO/IEC 14496-12 section 4.2).
		it('skips the usertype of a uuid container when it descends into the box', async () => {
			const usertype = Uint8Array.from({ length: 16 }, (_, i) => 0x10 + i)
			const cncv = buildBox('CNCV', TEXT_ENCODER.encode('CanonCNCV'))
			const cndm = buildBox('CNDM', TEXT_ENCODER.encode('CNDM'))
			const uuid = buildBox('uuid', concatBytes(usertype, cncv, cndm))
			const uuidHeader = uuid.subarray(0, BOX_HEADER_SIZE + usertype.length)
			const moov = buildBox('moov', concatBytes(mvhd, uuid))

			const nested = await computeBmffHash(concatBytes(ftyp, moov), {
				exclusions: [{ xpath: '/moov/uuid/CNCV' }],
				offsetPrefixSize: 8,
			})
			deepStrictEqual(
				nested,
				await expectedHash(
					encodeBoxOffset(0),
					ftyp,
					encodeBoxOffset(ftyp.length),
					moov.subarray(0, BOX_HEADER_SIZE),
					mvhd,
					uuidHeader,
					cndm,
				),
			)

			const root = await computeBmffHash(concatBytes(ftyp, uuid), {
				exclusions: [{ xpath: '/uuid/CNCV' }],
				offsetPrefixSize: 8,
			})
			deepStrictEqual(
				root,
				await expectedHash(
					encodeBoxOffset(0),
					ftyp,
					encodeBoxOffset(ftyp.length),
					uuidHeader,
					cndm,
				),
			)
		})

		it('finds a nested box with a largesize header', async () => {
			const largesizeUdta = buildLargesizeBox('udta', TEXT_ENCODER.encode('udta payload'))
			const free = buildBox('free')
			const moov = buildBox('moov', concatBytes(largesizeUdta, free))
			const segment = concatBytes(ftyp, moov)

			const hash = await computeBmffHash(segment, {
				exclusions: [{ xpath: '/moov/udta' }],
				offsetPrefixSize: 8,
			})

			deepStrictEqual(
				hash,
				await expectedHash(
					encodeBoxOffset(0),
					ftyp,
					encodeBoxOffset(ftyp.length),
					moov.subarray(0, BOX_HEADER_SIZE),
					free,
				),
			)
		})

		it('keeps the hash of exclusions with root-only xpaths', async () => {
			const uuid = buildBox('uuid', Uint8Array.of(1))
			const free = buildBox('free')
			const segment = concatBytes(ftyp, moov, uuid, free)

			const hash = await computeBmffHash(segment, {
				exclusions: [{ xpath: '/uuid' }, { xpath: '/free' }],
				offsetPrefixSize: 8,
			})

			deepStrictEqual(
				hash,
				await expectedHash(encodeBoxOffset(0), ftyp, encodeBoxOffset(ftyp.length), moov),
			)
		})
	})
})
