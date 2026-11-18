import {
	assert,
	describe,
	filterBoxes,
	it,
	readIsoBoxes,
	readStss,
	writeStss,
} from '../util/box.ts'

const STSS = new Uint8Array([
	0x00, 0x00, 0x00, 0x18, 0x73, 0x74, 0x73, 0x73, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02,
	0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x1f,
])

describe('readStss', function () {
	it('should read the sample numbers as a list of numbers', function () {
		// #region example
		const [box] = readIsoBoxes(STSS, { readers: { stss: readStss } })

		assert.ok(box.type === 'stss')
		assert.deepStrictEqual(box.sampleNumber, [1, 31])
		// #endregion example
	})

	it('should read the stss box of a fixture', function () {
		const [box] = filterBoxes('time_to_sample.mp4', 'stss', { readers: { stss: readStss } })

		assert.strictEqual(box.sampleNumber.length, box.entryCount)
		assert.ok(box.sampleNumber.every(sampleNumber => typeof sampleNumber === 'number'))
	})

	it('should write the bytes that it reads', function () {
		const [box] = readIsoBoxes(STSS, { readers: { stss: readStss } })

		assert.ok(box.type === 'stss')
		assert.deepStrictEqual(new Uint8Array(writeStss(box).buffer), STSS)
	})
})
