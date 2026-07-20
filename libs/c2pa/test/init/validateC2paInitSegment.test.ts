import { validateC2paInitSegment, LiveVideoStatusCode } from '@svta/cml-c2pa'
import { deepStrictEqual, ok, rejects, strictEqual } from 'node:assert'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { encode } from 'cbor-x/encode'
import { computeBmffHash } from '../../src/bmff/computeBmffHash.ts'

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

describe('validateC2paInitSegment — BMFF hash assertion offset prefix (§18.6.2)', () => {
	const TEXT_ENCODER = new TextEncoder()

	// JUMBF UUID per ISO 19566-5 (same value as the internal JUMBF_UUID in src/utils.ts)
	const JUMBF_UUID = [
		0xd8, 0xfe, 0xc3, 0xd6, 0x1b, 0x0e, 0x48, 0x3c,
		0x92, 0x97, 0x58, 0x28, 0x87, 0x7e, 0xc4, 0x81,
	] as const

	function concatBytes(...parts: readonly Uint8Array[]): Uint8Array {
		const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0))
		let offset = 0
		for (const part of parts) {
			out.set(part, offset)
			offset += part.length
		}
		return out
	}

	function buildBox(type: string, payload: Uint8Array = new Uint8Array(0)): Uint8Array {
		const box = new Uint8Array(8 + payload.length)
		new DataView(box.buffer).setUint32(0, box.length, false)
		for (let i = 0; i < 4; i++) box[4 + i] = type.charCodeAt(i)
		box.set(payload, 8)
		return box
	}

	function buildJumd(label: string): Uint8Array {
		const labelBytes = TEXT_ENCODER.encode(label)
		const data = new Uint8Array(16 + 1 + labelBytes.length + 1)
		data[16] = 0x03 // toggles: requestable + label present
		data.set(labelBytes, 17)
		return buildBox('jumd', data)
	}

	function buildJumb(label: string, ...content: readonly Uint8Array[]): Uint8Array {
		return buildBox('jumb', concatBytes(buildJumd(label), ...content))
	}

	function buildInitMediaBoxes(): Uint8Array {
		return concatBytes(buildBox('ftyp', TEXT_ENCODER.encode('isom')), buildBox('moov'))
	}

	// Unsigned init segment with a `c2pa.hash.bmff.v3` assertion; no signature box,
	// so integrity checks skip signature verification.
	function buildInitSegment(assertionData: Record<string, unknown>): Uint8Array {
		const bmffAssertion = buildJumb('c2pa.hash.bmff.v3', buildBox('cbor', encode(assertionData) as Uint8Array))
		const assertionStore = buildJumb('c2pa.assertions', bmffAssertion)
		const claimData = { instanceID: 'urn:uuid:bmff-hash-test-manifest', created_assertions: [] }
		const claim = buildJumb('c2pa.claim', buildBox('cbor', encode(claimData) as Uint8Array))
		const manifestJumb = buildJumb('urn:uuid:bmff-hash-test-manifest', claim, assertionStore)
		const store = buildJumb('c2pa', manifestJumb)

		const purpose = TEXT_ENCODER.encode('manifest')
		const prefix = new Uint8Array(4 + purpose.length + 1 + 8) // fullbox header + purpose\0 + aux offset
		prefix.set(purpose, 4)
		const uuidBox = buildBox('uuid', concatBytes(new Uint8Array(JUMBF_UUID), prefix, store))

		return concatBytes(buildInitMediaBoxes(), uuidBox)
	}

	// /uuid is excluded, so the flat hash covers only ftyp + moov — computable up front.
	async function buildInitWithFlatHash(offsetPrefixSize: number): Promise<Uint8Array> {
		const hash = await computeBmffHash(buildInitMediaBoxes(), { offsetPrefixSize })
		return buildInitSegment({ exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash })
	}

	it('accepts a flat hash computed with 8-byte box-offset prefixes', async () => {
		const init = await buildInitWithFlatHash(8)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.errorCodes.includes(LiveVideoStatusCode.INIT_INVALID), false)
	})

	it('rejects a flat hash computed without box-offset prefixes', async () => {
		const init = await buildInitWithFlatHash(0)

		const result = await validateC2paInitSegment(init)

		ok(result.errorCodes.includes(LiveVideoStatusCode.INIT_INVALID))
	})

	it('accepts the flat hash of a real signed init segment', async () => {
		const bytes = new Uint8Array(
			readFileSync(new URL('../fixtures/init_signed_with_session_keys.m4s', import.meta.url)),
		)

		const result = await validateC2paInitSegment(bytes)

		strictEqual(result.errorCodes.includes(LiveVideoStatusCode.INIT_INVALID), false)
	})
})
