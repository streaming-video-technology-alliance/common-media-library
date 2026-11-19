import { createVisualSampleEntryReader, readIsoBoxes } from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { describe, it } from 'vite-plus/test'

describe('createVisualSampleEntryReader', function () {
	it('should read a sample entry of a type that VisualSampleEntryType does not list', function () {
		// #region example
		// A vp09 sample entry of 86 bytes: the box header, then the visual sample entry fields, all 0.
		const bytes = new Uint8Array(86)
		new DataView(bytes.buffer).setUint32(0, 86)
		bytes.set([0x76, 0x70, 0x30, 0x39], 4)

		const [entry] = readIsoBoxes(bytes, {
			readers: {
				vp09: createVisualSampleEntryReader('vp09'),
			},
		})
		// #endregion example

		assert.ok(entry)
		assert.strictEqual(entry.type, 'vp09')
		assert.ok('width' in entry)
		assert.strictEqual(entry.width, 0)
		assert.deepStrictEqual(entry.boxes, [])
	})
})
