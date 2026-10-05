import { validateC2paInitSegment, validateC2paSegment, LiveVideoStatusCode } from '@svta/cml-c2pa'
import { deepStrictEqual, strictEqual } from 'node:assert'
import { before, describe, it, type TestContext } from 'node:test'
import { createTestSigner } from '../testSigner.ts'
import { buildSessionKeysInitSegment, buildVsiSegment, createTestSessionKey } from '../vsi/vsiTestUtils.ts'

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

	describe('session key validity period (§18.25.2)', () => {
		const INIT_VALIDATION_TIME = Date.parse('2025-07-29T10:30:00Z')
		const KEY_002_CREATED_AT = '2025-07-29T11:00:00Z'
		let init: Uint8Array
		let segment: Uint8Array

		// The two keys of the §18.25.3 example. The segment is signed with key_002.
		before(async () => {
			const signer = await createTestSigner()
			const key001 = await createTestSessionKey('key_001')
			const key002 = await createTestSessionKey('key_002')
			init = await buildSessionKeysInitSegment(signer, [
				{ key: key001, minSequenceNumber: 175, createdAt: '2025-07-29T10:00:00Z', validityPeriod: 3900 },
				{ key: key002, minSequenceNumber: 1975, createdAt: KEY_002_CREATED_AT, validityPeriod: 3900 },
			])
			segment = await buildVsiSegment(key002, 1975)
		})

		// Validates the init segment before key_002 is active, then the segment at `segmentTime`.
		async function validateSegmentAt(context: TestContext, segmentTime: number) {
			context.mock.timers.enable({ apis: ['Date'], now: INIT_VALIDATION_TIME })
			const { sessionKeys } = await validateC2paInitSegment(init)
			context.mock.timers.setTime(segmentTime)
			return validateC2paSegment(segment, sessionKeys)
		}

		it('rejects a segment signed with a session key that is not yet active', async (context) => {
			const validated = await validateSegmentAt(context, Date.parse(KEY_002_CREATED_AT) - 1)

			strictEqual(validated?.result.isValid, false)
			deepStrictEqual(validated?.result.errorCodes, [LiveVideoStatusCode.SESSIONKEY_INVALID])
		})

		it('accepts the same segment once the session key is active', async (context) => {
			const validated = await validateSegmentAt(context, Date.parse(KEY_002_CREATED_AT))

			strictEqual(validated?.result.isValid, true)
			deepStrictEqual(validated?.result.errorCodes, [])
		})
	})
})
