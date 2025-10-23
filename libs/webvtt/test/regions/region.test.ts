import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../utils/expectCuesEqualAll.ts'

describe('region tests', () => {

	it('region.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/regions/region.vtt', './test/webvtt/regions/region.json')
	})

})
