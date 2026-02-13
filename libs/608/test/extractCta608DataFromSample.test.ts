import { extractCta608DataFromSample } from '@svta/cml-608'
import { deepEqual, equal } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'
import { parseSegment } from './utils/helpers.ts'

/**
 * Parse an m4s segment and extract CTA-608 data from all samples.
 */
function parseSegmentSamples(file: Buffer): { sampleIndex: number; fieldData: number[][] }[] {
	const { view, mdatBodyStart, samples } = parseSegment(file)

	let cursor = mdatBodyStart
	const results: { sampleIndex: number; fieldData: number[][] }[] = []

	for (let i = 0; i < samples.length; i++) {
		const fieldData = extractCta608DataFromSample(view, cursor, samples[i].size)
		if (fieldData[0].length > 0 || fieldData[1].length > 0) {
			results.push({ sampleIndex: i, fieldData })
		}
		cursor += samples[i].size
	}

	return results
}

const field1CaptionData1 = [148, 32, 148, 174, 16, 196, 229, 110, 103, 186, 145, 185, 176, 176, 186, 176, 49, 186, 176, 182, 186, 176, 176, 128, 148, 44, 148, 47]
const field2CaptionData1 = [148, 32, 148, 174, 16, 196, 115, 247, 229, 186, 145, 185, 176, 176, 186, 176, 49, 186, 176, 182, 186, 176, 176, 128, 148, 44, 148, 47]
const field1CaptionData2 = [148, 32, 148, 174, 19, 70, 229, 110, 103, 186, 145, 185, 176, 176, 186, 176, 49, 186, 176, 55, 186, 176, 176, 128, 148, 44, 148, 47]
const field2CaptionData2 = [148, 32, 148, 174, 19, 70, 115, 247, 229, 186, 145, 185, 176, 176, 186, 176, 49, 186, 176, 55, 186, 176, 176, 128, 148, 44, 148, 47]

describe('extractCta608DataFromSample', () => {
	// #region example
	it('should extract CTA-608 field data from an H.264 m4s segment', async () => {
		const file = await readFile('test/fixtures/608_h264.m4s')
		const results = parseSegmentSamples(file)

		// Two samples in this segment contain CTA-608 data
		equal(results.length, 2)

		// First sample (index 0) - keyframe with embedded captions
		equal(results[0].sampleIndex, 0)
		deepEqual(results[0].fieldData, [field1CaptionData1, field2CaptionData1])

		// Second sample (index 30) - another keyframe with embedded captions
		equal(results[1].sampleIndex, 30)
		deepEqual(results[1].fieldData, [field1CaptionData2, field2CaptionData2])
	})
	// #endregion example

	it('should extract CTA-608 field data from an H.265 m4s segment', async () => {
		const file = await readFile('test/fixtures/608_h265.m4s')
		const results = parseSegmentSamples(file)

		// Two samples in this segment contain CTA-608 data
		equal(results.length, 2)

		// First sample (index 0) - keyframe with embedded captions
		equal(results[0].sampleIndex, 0)
		deepEqual(results[0].fieldData, [field1CaptionData1, field2CaptionData1])

		// Second sample (index 29) - another keyframe with embedded captions
		equal(results[1].sampleIndex, 29)
		deepEqual(results[1].fieldData, [field1CaptionData2, field2CaptionData2])
	})

	it('should produce identical CTA-608 data from H.264 and H.265 segments', async () => {
		const h264File = await readFile('test/fixtures/608_h264.m4s')
		const h265File = await readFile('test/fixtures/608_h265.m4s')

		const h264Results = parseSegmentSamples(h264File)
		const h265Results = parseSegmentSamples(h265File)

		equal(h264Results.length, h265Results.length)

		for (let i = 0; i < h264Results.length; i++) {
			deepEqual(h264Results[i].fieldData, h265Results[i].fieldData)
		}
	})

	it('should return empty field data for H.264 samples without CTA-608 data', async () => {
		const file = await readFile('test/fixtures/608_h264.m4s')
		const { view, mdatBodyStart, samples } = parseSegment(file)

		// Advance to sample index 1 (non-keyframe, no captions)
		const sample1Offset = mdatBodyStart + samples[0].size
		const result = extractCta608DataFromSample(view, sample1Offset, samples[1].size)

		deepEqual(result, [[], []])
	})

	it('should return empty field data for H.265 samples without CTA-608 data', async () => {
		const file = await readFile('test/fixtures/608_h265.m4s')
		const { view, mdatBodyStart, samples } = parseSegment(file)

		// Advance to sample index 1 (non-keyframe, no captions)
		const sample1Offset = mdatBodyStart + samples[0].size
		const result = extractCta608DataFromSample(view, sample1Offset, samples[1].size)

		deepEqual(result, [[], []])
	})
})
