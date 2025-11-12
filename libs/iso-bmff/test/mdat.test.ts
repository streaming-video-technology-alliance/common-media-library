import { MediaDataBox } from '@svta/cml-iso-bmff'
import { assert, describe, it, parseBox_ } from './util/box.ts'

describe('mdat box', function () {
	it('should correctly parse the mdat box', function () {
		const box = parseBox_<MediaDataBox>('captions.mp4', MediaDataBox, 2)

		assert.strictEqual(box.type, 'mdat')
		assert.strictEqual(box.size, 21530)
		assert.strictEqual(box.data.byteLength, 21522)
	})
})
