import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'
import { boxBytes } from './util/wideBoxes.ts'
import { assert, describe, isIsoBoxReadError, it, readIsoBoxes, readTfdt } from './util/box.ts'

// A version 1 tfdt box with 2 of the 8 bytes of baseMediaDecodeTime.
const SHORT_TFDT = boxBytes('tfdt', [1, 1], [0, 3], [0, 2])
const MOOF = boxBytes('moof', boxBytes('traf', SHORT_TFDT))

describe('isIsoBoxReadError', function () {
	it('should return true for the error of a reader, with the position of the box', function () {
		// #region example
		let report = ''

		try {
			readIsoBoxes(MOOF, { readers: { tfdt: readTfdt } })
		} catch (error) {
			if (!isIsoBoxReadError(error)) {
				throw error
			}

			const { type, start, pos } = error.box

			report = `${type} at ${start}: ${error.message} (position ${pos})`
		}
		// #endregion example

		assert.match(
			report,
			/^tfdt at 16: Cannot read 8 bytes at position 28: the box ends at 30 \(position 28\)$/,
		)
	})

	it('should name the innermost box and keep the error', function () {
		const thrown = new RangeError('custom')
		const readTfdtFails = () => {
			throw thrown
		}

		assert.throws(
			() => readIsoBoxes(MOOF, { readers: { tfdt: readTfdtFails } }),
			(error: unknown) =>
				error === thrown &&
				isIsoBoxReadError(error) &&
				error.name === 'RangeError' &&
				error.message === 'custom' &&
				error.box.type === 'tfdt' &&
				error.box.start === 16 &&
				error.box.pos === 24,
		)
	})

	it('should return false for an error of another class', function () {
		const readTfdtFails = () => {
			throw new TypeError('not a range error')
		}

		assert.throws(
			() => readIsoBoxes(MOOF, { readers: { tfdt: readTfdtFails } }),
			(error: unknown) =>
				error instanceof TypeError && !isIsoBoxReadError(error) && !('box' in error),
		)
		assert.strictEqual(isIsoBoxReadError(new RangeError('no box')), false)
		assert.strictEqual(isIsoBoxReadError(null), false)
	})

	it('should not change an error that is not extensible', function () {
		const frozen = new RangeError('frozen')
		const readTfdtFails = () => {
			Object.freeze(frozen)

			throw frozen
		}

		assert.throws(
			() => readIsoBoxes(MOOF, { readers: { tfdt: readTfdtFails } }),
			(error: unknown) => error === frozen && !isIsoBoxReadError(error),
		)
	})

	it('should return false for a RangeError with a box field that is not an object', function () {
		const error = Object.assign(new RangeError('custom'), { box: 'tfdt' })

		assert.strictEqual(isIsoBoxReadError(error), false)
	})

	it('should add the field to the error of the depth limit', function () {
		// 128 moov boxes, each inside the one before, then a free box at level 128.
		let bytes = boxBytes('free')

		for (let i = 0; i < 128; i++) {
			bytes = boxBytes('moov', bytes)
		}

		assert.throws(
			() => readIsoBoxes(bytes),
			(error: unknown) =>
				isIsoBoxReadError(error) &&
				error.message === 'The box free is deeper than the limit of 128 levels' &&
				error.box.type === 'free' &&
				error.box.start === 1024 &&
				error.box.pos === 1024,
		)
	})

	it('should count the position from the first byte of a view with a byte offset', function () {
		const padded = reduceUint8Arrays([new Uint8Array(5), MOOF])

		assert.throws(
			() => readIsoBoxes(padded.subarray(5), { readers: { tfdt: readTfdt } }),
			(error: unknown) =>
				isIsoBoxReadError(error) && error.box.start === 16 && error.box.pos === 28,
		)
	})
})
