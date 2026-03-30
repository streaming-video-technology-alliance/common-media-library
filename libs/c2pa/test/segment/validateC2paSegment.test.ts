import { validateC2paSegment } from '@svta/cml-c2pa'
import { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateC2paSegment', () => {
	// #region example
	it('returns null when segment has no C2PA EMSG box', async () => {
		const result = await validateC2paSegment(
			new Uint8Array(0),
			[],
		)

		strictEqual(result, null)
	})
	// #endregion example
})
