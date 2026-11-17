import { readIsoBoxes, readTfdt, writeIsoBox, writeTfdt } from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { describe, it } from 'vite-plus/test'

describe('writeIsoBox', function () {
	it('should write one box', function () {
		// #region example
		const bytes = writeIsoBox(
			{ type: 'tfdt', version: 1, flags: 0, baseMediaDecodeTime: 90000 },
			{ writers: { tfdt: writeTfdt } },
		)
		// #endregion example

		const [tfdt] = readIsoBoxes(bytes, { readers: { tfdt: readTfdt } })

		assert.strictEqual(bytes.length, 20)
		assert.ok(tfdt?.type === 'tfdt')
		assert.strictEqual(tfdt.baseMediaDecodeTime, 90000)
	})
})
