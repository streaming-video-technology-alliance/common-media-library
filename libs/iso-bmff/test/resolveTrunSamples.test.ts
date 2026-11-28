import {
	assert,
	describe,
	findBox,
	it,
	readTfhd,
	readTrex,
	readTrun,
	resolveTrunSamples,
	type TrackExtendsBox,
	type TrackFragmentHeaderBox,
	type TrackRunBox,
} from './util/box.ts'

const TREX: TrackExtendsBox = {
	type: 'trex',
	version: 0,
	flags: 0,
	trackId: 1,
	defaultSampleDescriptionIndex: 1,
	defaultSampleDuration: 1000,
	defaultSampleSize: 2000,
	defaultSampleFlags: 0x01010000,
}

const TFHD: TrackFragmentHeaderBox = {
	type: 'tfhd',
	version: 0,
	flags: 0x28,
	trackId: 1,
	baseDataOffset: undefined,
	sampleDescriptionIndex: undefined,
	defaultSampleDuration: 500,
	defaultSampleSize: undefined,
	defaultSampleFlags: 0x02000000,
}

const TRUN: TrackRunBox = {
	type: 'trun',
	version: 0,
	flags: 0x205,
	dataOffset: 100,
	firstSampleFlags: 0x02000000,
	samples: [
		{
			sampleDuration: undefined,
			sampleSize: 10,
			sampleFlags: undefined,
			sampleCompositionTimeOffset: undefined,
		},
		{
			sampleDuration: undefined,
			sampleSize: 20,
			sampleFlags: undefined,
			sampleCompositionTimeOffset: undefined,
		},
	],
}

describe('resolveTrunSamples', function () {
	it('should fill the sample fields from the tfhd and trex defaults', function () {
		// #region example
		const trex = findBox('test_frag.mp4', 'trex', { readers: { trex: readTrex } })
		const tfhd = findBox('test_frag.mp4', 'tfhd', { readers: { tfhd: readTfhd } })
		const trun = findBox('test_frag.mp4', 'trun', { readers: { trun: readTrun } })

		const samples = resolveTrunSamples(trun, tfhd, trex)
		const duration = samples.reduce((sum, sample) => sum + (sample.sampleDuration ?? 0), 0)
		// #endregion example

		assert.strictEqual(samples.length, trun.samples.length)
		assert.ok(duration > 0)

		for (const sample of samples) {
			assert.strictEqual(typeof sample.sampleDuration, 'number')
			assert.strictEqual(typeof sample.sampleSize, 'number')
			assert.strictEqual(typeof sample.sampleFlags, 'number')
			assert.strictEqual(typeof sample.sampleCompositionTimeOffset, 'number')
		}
	})

	it('should prefer the trun field, then the tfhd default, then the trex default', function () {
		const samples = resolveTrunSamples(TRUN, TFHD, TREX)

		assert.deepStrictEqual(samples, [
			{
				sampleDuration: 500,
				sampleSize: 10,
				sampleFlags: 0x02000000,
				sampleCompositionTimeOffset: 0,
			},
			{
				sampleDuration: 500,
				sampleSize: 20,
				sampleFlags: 0x02000000,
				sampleCompositionTimeOffset: 0,
			},
		])
	})

	it('should apply firstSampleFlags to the first sample only', function () {
		const trun: TrackRunBox = { ...TRUN, firstSampleFlags: 0x00000000 }
		const samples = resolveTrunSamples(trun, undefined, TREX)

		assert.strictEqual(samples[0]?.sampleFlags, 0)
		assert.strictEqual(samples[1]?.sampleFlags, TREX.defaultSampleFlags)
		assert.strictEqual(samples[0]?.sampleDuration, TREX.defaultSampleDuration)
	})

	it('should keep a sample flags field of the trun box over firstSampleFlags', function () {
		const trun: TrackRunBox = {
			...TRUN,
			samples: [
				{
					sampleDuration: undefined,
					sampleSize: 10,
					sampleFlags: 7,
					sampleCompositionTimeOffset: undefined,
				},
			],
		}

		assert.strictEqual(resolveTrunSamples(trun, TFHD, TREX)[0]?.sampleFlags, 7)
	})

	it('should leave a field undefined when no box has a value for it', function () {
		const [first] = resolveTrunSamples({ ...TRUN, firstSampleFlags: undefined })

		assert.deepStrictEqual(first, {
			sampleDuration: undefined,
			sampleSize: 10,
			sampleFlags: undefined,
			sampleCompositionTimeOffset: 0,
		})
	})

	it('should return an empty list for a trun box with no samples', function () {
		assert.deepStrictEqual(resolveTrunSamples({ ...TRUN, samples: [] }, TFHD, TREX), [])
	})
})
