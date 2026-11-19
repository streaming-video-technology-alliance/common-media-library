import {
	createDefaultReaderConfig,
	createDefaultWriterConfig,
	readIsoBoxes,
	writeIsoBoxes,
} from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'vite-plus/test'

describe('createDefaultWriterConfig', function () {
	it('should write the boxes that createDefaultReaderConfig reads', async function () {
		// #region example
		const isoFile = await readFile(new URL('../fixtures/emsg.m4s', import.meta.url))
		const boxes = readIsoBoxes(isoFile, createDefaultReaderConfig())

		const bytes = writeIsoBoxes(boxes, createDefaultWriterConfig())
		// #endregion example

		assert.strictEqual(Buffer.compare(bytes, isoFile), 0)
	})

	it('should have a writer for each box type of createDefaultReaderConfig', function () {
		const { readers } = createDefaultReaderConfig()
		const { writers } = createDefaultWriterConfig()

		assert.deepStrictEqual(Object.keys(writers).sort(), Object.keys(readers ?? {}).sort())
	})
})
