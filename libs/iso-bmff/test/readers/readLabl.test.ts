import {
	assert,
	describe,
	findBox,
	isIsoBoxType,
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
		const grpl = meta.boxes.find(child => isIsoBoxType('grpl', child))
		assert.ok(isIsoBoxType('grpl', grpl))

		const prsl = grpl.boxes.find(
			(child): child is PreselectionGroupBox =>
				isIsoBoxType('prsl', child) && child.groupId === 234,
		)
		assert.ok(prsl)

		const boxes = prsl.boxes.filter((child): child is LabelBox => isIsoBoxType('labl', child))

		assert.strictEqual(boxes[0].type, 'labl')
		assert.strictEqual(boxes[0].flags & 0x1, 0)
		assert.strictEqual(boxes[0].language, 'en')
		assert.strictEqual(boxes[0].label, 'Spanish')
		assert.strictEqual(boxes[1].type, 'labl')
		assert.strictEqual(boxes[1].flags & 0x1, 0)
		assert.strictEqual(boxes[1].language, 'es')
		assert.strictEqual(boxes[1].label, 'Español')
	})
})
