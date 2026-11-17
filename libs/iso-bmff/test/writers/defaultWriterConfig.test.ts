import {
	defaultReaderConfig,
	defaultWriterConfig,
	readIsoBoxes,
	writeIsoBoxes,
} from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'vite-plus/test'

describe('defaultWriterConfig', function () {
	it('should write the boxes that defaultReaderConfig reads', async function () {
		// #region example
		const isoFile = await readFile(new URL('../fixtures/emsg.m4s', import.meta.url))
		const boxes = readIsoBoxes(isoFile, defaultReaderConfig())

		const byteArrays = writeIsoBoxes(boxes, defaultWriterConfig())
		// #endregion example

		const written = Buffer.concat(byteArrays)
		assert.strictEqual(Buffer.compare(written, isoFile), 0)
	})

	it('should have a writer for each box type of defaultReaderConfig', function () {
		const { readers } = defaultReaderConfig()
		const { writers } = defaultWriterConfig()

		assert.deepStrictEqual(Object.keys(writers).sort(), Object.keys(readers ?? {}).sort())
	})
})
