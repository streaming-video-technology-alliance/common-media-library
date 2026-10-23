import {
	assert,
	describe,
	findBox,
	it,
	readLabl,
	readMeta,
	readPrsl,
	type LabelBox,
	type MetaBox,
	type PreselectionGroupBox,
} from '../util/box.ts'

describe('readLabl', function () {
	it('should correctly parse the box from sample data', function () {
		const meta = findBox('SRMP_AC4.mp4', 'meta', {
			readers: { meta: readMeta, prsl: readPrsl, labl: readLabl },
		}) as MetaBox
		const grpl = meta.boxes.find(child => child.type === 'grpl')
		assert.ok(grpl)

		const prsl = grpl.boxes.find((child: PreselectionGroupBox) => child.groupId === 234) as
			| PreselectionGroupBox
			| undefined
		assert.ok(prsl)

		const boxes = prsl.boxes.filter((child: LabelBox) => child.type === 'labl') as LabelBox[]

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
