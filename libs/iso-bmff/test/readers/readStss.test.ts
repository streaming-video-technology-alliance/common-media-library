import { writeWith } from '../util/writeWith.ts'
import {
	assert,
	describe,
	filterBoxes,
	isIsoBoxType,
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

		assert.ok(isIsoBoxType('stss', box))
		assert.deepStrictEqual(box.sampleNumber, [1, 31])
		// #endregion example
	})

	it('should read the stss box of a fixture', function () {
		const [box] = filterBoxes('time_to_sample.mp4', 'stss', { readers: { stss: readStss } })

		assert.ok(box.sampleNumber.length > 0)
		assert.ok(box.sampleNumber.every(sampleNumber => typeof sampleNumber === 'number'))
	})

	it('should write the bytes that it reads', function () {
		const [box] = readIsoBoxes(STSS, { readers: { stss: readStss } })

		assert.ok(isIsoBoxType('stss', box))
		assert.deepStrictEqual(new Uint8Array(writeWith(writeStss, box).buffer), STSS)
	})
})
