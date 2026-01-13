import { assert, describe, findBox, it, readLabl, readMeta, readPrsl, type ParsedIsoBox } from '../util/box.ts'

describe('readLabl', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox('SRMP_AC4.mp4', 'meta', { readers: { meta: readMeta, prsl: readPrsl, labl: readLabl } })
			// @ts-expect-error: Not sure why this is needed
			.boxes?.filter((box: ParsedIsoBox) => box.type === 'grpl')[0]
			// @ts-expect-error: Add type for `boxes` and `groupId` in `grpl` box
			.boxes?.filter((box: ParsedIsoBox) => box.groupId === 234)[0]

		assert.ok(box)
		assert.ok(box.boxes)

		const boxes = box.boxes.filter((box: ParsedIsoBox) => box.type === 'labl')

		assert.strictEqual(boxes[0].type, 'labl')
		assert.strictEqual(boxes[0].isGroupLabel, false)
		assert.strictEqual(boxes[0].language, 'en')
		assert.strictEqual(boxes[0].label, 'Spanish')
		assert.strictEqual(boxes[1].type, 'labl')
		assert.strictEqual(boxes[1].isGroupLabel, false)
		assert.strictEqual(boxes[1].language, 'es')
		assert.strictEqual(boxes[1].label, 'Español')
	})
})
