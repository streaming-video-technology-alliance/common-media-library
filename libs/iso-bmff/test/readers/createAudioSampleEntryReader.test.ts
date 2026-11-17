import {
	createAudioSampleEntryReader,
	findIsoBox,
	readIsoBoxes,
	readStsd,
} from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'vite-plus/test'

describe('createAudioSampleEntryReader', function () {
	it('should read a sample entry of a type that AudioSampleEntryType does not list', async function () {
		// #region example
		const isoFile = await readFile(new URL('../fixtures/SRMP_AC4.mp4', import.meta.url))
		const boxes = readIsoBoxes(isoFile, {
			readers: {
				stsd: readStsd,
				'ac-4': createAudioSampleEntryReader('ac-4'),
			},
		})

		const stsd = findIsoBox(boxes, box => box.type === 'stsd')
		const entry = stsd?.entries[0]
		// #endregion example

		assert.ok(entry)
		assert.strictEqual(entry.type, 'ac-4')
		assert.strictEqual(entry.channelcount, 6)
		assert.strictEqual(entry.samplerate, 48000)
		assert.strictEqual(entry.samplesize, 16)
	})
})
