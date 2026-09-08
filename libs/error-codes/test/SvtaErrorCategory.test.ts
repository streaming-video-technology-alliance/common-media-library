import * as errorCodes from '@svta/cml-error-codes'
import { SvtaErrorCategory } from '@svta/cml-error-codes'
import assert, { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('SvtaErrorCategory', () => {
	it('provides a valid example', () => {
		//#region example
		const category = SvtaErrorCategory.NETWORK

		assert(category === 3)
		//#endregion example
	})

	it('matches the spec category table', () => {
		strictEqual(SvtaErrorCategory.UNKNOWN, 0)
		strictEqual(SvtaErrorCategory.MEDIA_CONTENT, 1)
		strictEqual(SvtaErrorCategory.PLAYBACK, 2)
		strictEqual(SvtaErrorCategory.NETWORK, 3)
		strictEqual(SvtaErrorCategory.CONTENT_PROTECTION, 4)
		strictEqual(SvtaErrorCategory.ACCESSIBILITY, 5)
		strictEqual(SvtaErrorCategory.REMOTE_PLAY, 6)
		strictEqual(SvtaErrorCategory.ADVERTISING, 7)
		strictEqual(SvtaErrorCategory.CUSTOM, 99)
		strictEqual(Object.keys(SvtaErrorCategory).length, 9)
	})

	it('exports each category as an individual const', () => {
		const exported: Record<string, unknown> = errorCodes
		for (const [name, value] of Object.entries(SvtaErrorCategory)) {
			strictEqual(exported[`SVTA_ERROR_CATEGORY_${name}`], value)
		}
	})
})
