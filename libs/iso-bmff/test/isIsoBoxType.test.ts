import { isIsoBoxType, readIsoBoxes, readTfdt, traverseIsoBoxes } from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'vite-plus/test'

describe('isIsoBoxType', function () {
	it('should narrow a box to the type of its four-character code', async function () {
		// #region example
		const isoFile = await readFile(new URL('./fixtures/mss_moof_tfdt.mp4', import.meta.url))
		const boxes = readIsoBoxes(isoFile, { readers: { tfdt: readTfdt } })

		const times: number[] = []
		for (const box of traverseIsoBoxes(boxes)) {
			if (isIsoBoxType('tfdt', box)) {
				times.push(box.baseMediaDecodeTime)
			}
		}
		// #endregion example

		assert.deepStrictEqual(times, [1289430514831666])
	})

	it('should return false for another type', function () {
		assert.strictEqual(
			isIsoBoxType('tfdt', { type: 'mfhd', version: 0, flags: 0, sequenceNumber: 1 }),
			false,
		)
	})
})
