import { assert, describe, it, readElst, readIsoBoxes, writeElst } from '../util/box.ts'
import { ELST_V1 } from '../util/ELST_V1.ts'

describe('writeElst', function () {
	it('should write a parsed version 1 EditListBox back to the same bytes', function () {
		const [box] = readIsoBoxes(ELST_V1, { readers: { elst: readElst } })

		assert.ok(box)
		assert.strictEqual(box.type, 'elst')

		const writer = writeElst(box)

		assert.deepStrictEqual(new Uint8Array(writer.buffer), ELST_V1)
	})
})
