import { validateC2paInitSegment, LiveVideoStatusCode } from '@svta/cml-c2pa'
import { deepStrictEqual, rejects, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

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
