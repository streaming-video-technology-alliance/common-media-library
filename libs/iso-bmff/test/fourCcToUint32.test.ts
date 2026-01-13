import { fourCcToUint32 } from '@svta/cml-iso-bmff'
import { assert, describe, it } from './util/box.ts'

describe('fourCcToUint32', function () {
	it('should provide an example', function () {
		// #region example
		const result = fourCcToUint32('ftyp')

		assert.strictEqual(result, 0x66747970)
		// #endregion example
	})

	it('should convert mp4a to correct uint32', function () {
		const result = fourCcToUint32('mp4a')

		assert.strictEqual(result, 0x6d703461)
	})

	it('should convert moov to correct uint32', function () {
		const result = fourCcToUint32('moov')

		assert.strictEqual(result, 0x6d6f6f76)
	})

	it('should convert mdat to correct uint32', function () {
		const result = fourCcToUint32('mdat')

		assert.strictEqual(result, 0x6d646174)
	})

	it('should convert cenc to correct uint32', function () {
		const result = fourCcToUint32('cenc')

		assert.strictEqual(result, 0x63656e63)
	})

	it('should handle uppercase characters', function () {
		const result = fourCcToUint32('FREE')

		assert.strictEqual(result, 0x46524545)
	})

	it('should handle mixed case characters', function () {
		const result = fourCcToUint32('fLaC')

		assert.strictEqual(result, 0x664c6143)
	})
})
