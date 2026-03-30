import { extractVsiEmsgBox, parseEmsgBox } from '../../src/emsg/parseEmsgBox.ts'
import { ok, strictEqual, throws } from 'node:assert'
import { describe, it } from 'node:test'

describe('parseEmsgBox', () => {
	// #region example
	it('parses a version 0 EMSG box payload', () => {
		const schemeBytes = new TextEncoder().encode('test\0')
		const emptyValue = new Uint8Array([0x00])
		const payload = new Uint8Array([
			0x00, 0x00, 0x00, 0x00, // version=0, flags=0
			...schemeBytes,
			...emptyValue,
			0x00, 0x00, 0x03, 0xe8, // timescale=1000
			0x00, 0x00, 0x00, 0x00, // presentationTimeDelta=0
			0xff, 0xff, 0xff, 0xff, // eventDuration=0xFFFFFFFF
			0x00, 0x00, 0x00, 0x01, // id=1
		])
		const result = parseEmsgBox(payload)
		strictEqual(result.version, 0)
		strictEqual(result.schemeIdUri, 'test')
		strictEqual(result.timescale, 1000)
		ok(result.messageData instanceof Uint8Array)
	})
	// #endregion example

	it('throws for payload that is too small', () => {
		throws(() => parseEmsgBox(new Uint8Array([0x00, 0x00])), /EMSG payload too small/)
	})

	it('throws for unsupported EMSG version', () => {
		const payload = new Uint8Array(20).fill(0)
		payload[0] = 5 // unsupported version
		throws(() => parseEmsgBox(payload), /Unsupported EMSG version/)
	})
})

describe('extractVsiEmsgBox', () => {
	it('returns null for empty segment bytes', () => {
		strictEqual(extractVsiEmsgBox(new Uint8Array(0)), null)
	})

	it('returns null when no EMSG box is present', () => {
		// Minimal BMFF box: size=8, type='ftyp', no data
		const fakeBox = new Uint8Array([0x00, 0x00, 0x00, 0x08, 0x66, 0x74, 0x79, 0x70])
		strictEqual(extractVsiEmsgBox(fakeBox), null)
	})
})
