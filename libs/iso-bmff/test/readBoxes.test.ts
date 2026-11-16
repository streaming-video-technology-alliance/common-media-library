import { assert, describe, IsoBoxReadView, it } from './util/box.ts'
import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'
import { boxBytes } from './util/wideBoxes.ts'

const FREE = boxBytes('free', new Uint8Array([1, 2, 3, 4]))
const TWO_BOXES = reduceUint8Arrays([FREE, FREE])

describe('IsoBoxReadView.readBoxes', function () {
	it('should read no boxes for a length of 0', function () {
		const view = new IsoBoxReadView(TWO_BOXES)

		assert.strictEqual(view.readBoxes(0).length, 0)
		assert.strictEqual(view.cursor, 0)
	})

	it('should read one box for a length of 1', function () {
		const view = new IsoBoxReadView(TWO_BOXES)

		assert.strictEqual(view.readBoxes(1).length, 1)
		assert.strictEqual(view.cursor, FREE.length)
	})

	it('should read every box for a length of -1', function () {
		const view = new IsoBoxReadView(TWO_BOXES)

		assert.strictEqual(view.readBoxes(-1).length, 2)
	})

	it('should read every box for the default length', function () {
		const view = new IsoBoxReadView(TWO_BOXES)

		assert.strictEqual(view.readBoxes().length, 2)
	})
})
