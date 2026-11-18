import {
	createAudioSampleEntryReader,
	findIsoBox,
	readIsoBoxes,
	readStsd,
	type AudioSampleEntry,
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

		// The type of `entries` lists the built-in sample entries, so give the entry its type.
		const entry = stsd?.boxes[0] as AudioSampleEntry<'ac-4'> | undefined
		// #endregion example

		assert.ok(entry)
		assert.strictEqual(entry.type, 'ac-4')
		assert.strictEqual(entry.channelCount, 6)
		assert.strictEqual(entry.sampleRate, 48000)
		assert.strictEqual(entry.sampleSize, 16)
	})
})
