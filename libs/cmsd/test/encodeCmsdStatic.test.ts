import { CmsdObjectType, CmsdStreamingFormat, CmsdStreamType, encodeCmsdStatic } from '@svta/cml-cmsd'
import { SfToken } from '@svta/cml-structured-field-values'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'
import { CMSD_STATIC_OBJ } from './data/CMSD_STATIC_OBJ.ts'
import { CMSD_STATIC_STRING } from './data/CMSD_STATIC_STRING.ts'

describe('encodeCmsdStatic', () => {
	it('handles null value object', () => {
		// @ts-expect-error
		equal(encodeCmsdStatic(null), '')
	})

	it('returns encoded string', () => {
		equal(encodeCmsdStatic(CMSD_STATIC_OBJ), CMSD_STATIC_STRING)
	})

	it('returns encoded string when SfToken is used', () => {
		const input = Object.assign({}, CMSD_STATIC_OBJ, {
			ot: new SfToken(CmsdObjectType.VIDEO),
			sf: new SfToken(CmsdStreamingFormat.HLS),
			st: new SfToken(CmsdStreamType.VOD),
		})
		equal(encodeCmsdStatic(input), CMSD_STATIC_STRING)
	})
})
