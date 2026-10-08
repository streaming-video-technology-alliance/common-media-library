import { validateC2paInitSegment, validateC2paSegment, LiveVideoStatusCode, SequenceValidationReason, type SequenceState } from '@svta/cml-c2pa'
import { deepStrictEqual, rejects, strictEqual } from 'node:assert'
import { before, describe, it, type TestContext } from 'node:test'
import { createTestSigner } from '../testSigner.ts'
import { buildSessionKeysInitSegment, buildVsiSegment, createTestSessionKey, type TestSessionKey, type TestSessionKeyEntry } from '../vsi/vsiTestUtils.ts'

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

	describe('session key validity period (§18.25.2, §19.7.3)', () => {
		const INIT_VALIDATION_TIME = Date.parse('2025-07-29T10:30:00Z')
		const KEY_002_CREATED_AT = '2025-07-29T11:00:00Z'
		// KEY_002_CREATED_AT + 3900 seconds
		const KEY_002_EXPIRES_AT = '2025-07-29T12:05:00Z'
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
			deepStrictEqual(validated?.result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
		})

		it('accepts the same segment once the session key is active', async (context) => {
			const validated = await validateSegmentAt(context, Date.parse(KEY_002_CREATED_AT))

			strictEqual(validated?.result.isValid, true)
			deepStrictEqual(validated?.result.errorCodes, [])
		})

		it('rejects a segment signed with an expired session key', async (context) => {
			const validated = await validateSegmentAt(context, Date.parse(KEY_002_EXPIRES_AT) + 1)

			strictEqual(validated?.result.isValid, false)
			deepStrictEqual(validated?.result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
		})
	})

	// A BigInt encodes as a CBOR unsigned integer of 8 bytes, which decodes to a number up to 2^53 - 1.
	describe('sequenceNumber of 2^32 or more (§19.4.2)', () => {
		const NOW = Date.parse('2025-07-29T10:30:00Z')
		let init: Uint8Array
		let unsafeMinimumInit: Uint8Array
		let key: TestSessionKey

		before(async () => {
			const signer = await createTestSigner()
			key = await createTestSessionKey('key_001')
			init = await buildSessionKeysInitSegment(signer, [
				{ key, minSequenceNumber: 0, createdAt: '2025-07-29T10:00:00Z', validityPeriod: 3600 },
			])
			unsafeMinimumInit = await buildSessionKeysInitSegment(signer, [
				{ key, minSequenceNumber: BigInt(2 ** 53) + BigInt(1), createdAt: '2025-07-29T10:00:00Z', validityPeriod: 3600 } as unknown as TestSessionKeyEntry,
			])
		})

		async function validateInitAtNow(context: TestContext, initSegment: Uint8Array = init) {
			context.mock.timers.enable({ apis: ['Date'], now: NOW })
			return (await validateC2paInitSegment(initSegment)).sessionKeys
		}

		it('accepts a segment with a sequenceNumber of 2^32', async (context) => {
			const sessionKeys = await validateInitAtNow(context)

			const validated = await validateC2paSegment(await buildVsiSegment(key, BigInt(2 ** 32)), sessionKeys)

			strictEqual(validated?.result.sequenceNumber, 2 ** 32)
			strictEqual(validated?.result.isValid, true)
			deepStrictEqual(validated?.result.errorCodes, [])
		})

		it('detects no gap when the sequenceNumber passes 2^32', async (context) => {
			const sessionKeys = await validateInitAtNow(context)
			const reasons = []
			let sequenceState: SequenceState | undefined

			for (const sequenceNumber of [2 ** 32 - 1, BigInt(2 ** 32), BigInt(2 ** 32 + 1)]) {
				const validated = await validateC2paSegment(await buildVsiSegment(key, sequenceNumber), sessionKeys, sequenceState)
				reasons.push(validated?.result.sequenceResult.reason)
				sequenceState = validated?.nextSequenceState
			}

			deepStrictEqual(reasons, [SequenceValidationReason.VALID, SequenceValidationReason.VALID, SequenceValidationReason.VALID])
		})

		// Number() converts both 2^53 and 2^53 + 1 to 2^53.
		it('does not accept a segment below a minSequenceNumber above 2^53 - 1', async (context) => {
			const sessionKeys = await validateInitAtNow(context, unsafeMinimumInit)

			await rejects(validateC2paSegment(await buildVsiSegment(key, BigInt(2 ** 53)), sessionKeys), /sequenceNumber/)
		})
	})
})
