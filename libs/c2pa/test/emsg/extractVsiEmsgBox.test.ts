import { extractVsiEmsgBox } from '../../src/emsg/extractVsiEmsgBox.ts'
import { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('extractVsiEmsgBox', () => {
	// #region example
	it('returns null for empty segment bytes', () => {
		strictEqual(extractVsiEmsgBox(new Uint8Array(0)), null)
	})
	// #endregion example

	it('returns null when no EMSG box is present', () => {
		// Minimal BMFF box: size=8, type='ftyp', no data
		const fakeBox = new Uint8Array([0x00, 0x00, 0x00, 0x08, 0x66, 0x74, 0x79, 0x70])
		strictEqual(extractVsiEmsgBox(fakeBox), null)
	})
})
