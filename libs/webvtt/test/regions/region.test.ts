import { describe, it } from 'vitest'
import { expectCuesEqualAll } from '../utils/expectCuesEqualAll.ts'

describe('region tests', () => {
	it('region.vtt', async () => {
		await expectCuesEqualAll('test/regions/region.vtt', 'test/regions/region.json')
	})
})
