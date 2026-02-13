import { findCta608Nalus } from '@svta/cml-608'
import { deepEqual, equal } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'
import { parseSegment, verifyGa94Identifier } from './utils/helpers.ts'

describe('findCta608Nalus', () => {
	// #region example
	it('should find CTA-608 NAL unit ranges in an H.264 sample', async () => {
		const file = await readFile('test/fixtures/608_h264.m4s')
		const { view, mdatBodyStart, samples } = parseSegment(file)

		// First sample (keyframe) contains CTA-608 SEI NALUs
		const ranges = findCta608Nalus(view, mdatBodyStart, samples[0].size)

		// H.264 encodes each caption field as a separate SEI message
		equal(ranges.length, 2)

		// Each range should point to a valid GA94 identifier
		for (const [pos, size] of ranges) {
			equal(size, 53)
			verifyGa94Identifier(view, pos)
		}
	})
	// #endregion example

	it('should find CTA-608 NAL unit ranges in an H.265 sample', async () => {
		const file = await readFile('test/fixtures/608_h265.m4s')
		const { view, mdatBodyStart, samples } = parseSegment(file)

		// First sample (keyframe) contains CTA-608 SEI NALUs
		const ranges = findCta608Nalus(view, mdatBodyStart, samples[0].size)

		// H.265 encodes both caption fields in a single SEI message
		equal(ranges.length, 1)

		const [pos, size] = ranges[0]
		equal(size, 95)
		verifyGa94Identifier(view, pos)
	})

	it('should find CTA-608 ranges in all caption-bearing H.264 samples', async () => {
		const file = await readFile('test/fixtures/608_h264.m4s')
		const { view, mdatBodyStart, samples } = parseSegment(file)

		let cursor = mdatBodyStart
		const captionSamples: { sampleIndex: number; ranges: number[][] }[] = []

		for (let i = 0; i < samples.length; i++) {
			const ranges = findCta608Nalus(view, cursor, samples[i].size)
			if (ranges.length > 0) {
				captionSamples.push({ sampleIndex: i, ranges })
			}
			cursor += samples[i].size
		}

		equal(captionSamples.length, 2)
		equal(captionSamples[0].sampleIndex, 0)
		equal(captionSamples[1].sampleIndex, 30)

		// Both keyframes have 2 SEI payloads of 53 bytes each
		for (const { ranges } of captionSamples) {
			equal(ranges.length, 2)
			for (const [pos, size] of ranges) {
				equal(size, 53)
				verifyGa94Identifier(view, pos)
			}
		}
	})

	it('should find CTA-608 ranges in all caption-bearing H.265 samples', async () => {
		const file = await readFile('test/fixtures/608_h265.m4s')
		const { view, mdatBodyStart, samples } = parseSegment(file)

		let cursor = mdatBodyStart
		const captionSamples: { sampleIndex: number; ranges: number[][] }[] = []

		for (let i = 0; i < samples.length; i++) {
			const ranges = findCta608Nalus(view, cursor, samples[i].size)
			if (ranges.length > 0) {
				captionSamples.push({ sampleIndex: i, ranges })
			}
			cursor += samples[i].size
		}

		equal(captionSamples.length, 2)
		equal(captionSamples[0].sampleIndex, 0)
		equal(captionSamples[1].sampleIndex, 29)

		// Both keyframes have 1 SEI payload of 95 bytes each
		for (const { ranges } of captionSamples) {
			equal(ranges.length, 1)
			const [pos, size] = ranges[0]
			equal(size, 95)
			verifyGa94Identifier(view, pos)
		}
	})

	it('should return empty array for H.264 samples without CTA-608 data', async () => {
		const file = await readFile('test/fixtures/608_h264.m4s')
		const { view, mdatBodyStart, samples } = parseSegment(file)

		// Sample index 1 is a non-keyframe without captions
		const sample1Offset = mdatBodyStart + samples[0].size
		const ranges = findCta608Nalus(view, sample1Offset, samples[1].size)

		deepEqual(ranges, [])
	})

	it('should return empty array for H.265 samples without CTA-608 data', async () => {
		const file = await readFile('test/fixtures/608_h265.m4s')
		const { view, mdatBodyStart, samples } = parseSegment(file)

		// Sample index 1 is a non-keyframe without captions
		const sample1Offset = mdatBodyStart + samples[0].size
		const ranges = findCta608Nalus(view, sample1Offset, samples[1].size)

		deepEqual(ranges, [])
	})
})
