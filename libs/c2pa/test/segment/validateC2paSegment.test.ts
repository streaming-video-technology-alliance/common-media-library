import { validateC2paInitSegment, validateC2paSegment, LiveVideoStatusCode, SequenceValidationReason, type SequenceState, type ValidatedSessionKey } from '@svta/cml-c2pa'
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


// --- Replay protection: sequence state advances only from authentic segments ---

describe('validateC2paSegment — sequence state advances only from authentic segments', () => {
	const KEY_CREATED_AT = '2020-01-01T00:00:00Z'
	// About 31.7 years: the key is active in 2026 and expires in 2051.
	const KEY_VALIDITY_PERIOD = 1_000_000_000
	const BEFORE_KEY_CREATED_AT = Date.parse('2019-12-31T00:00:00Z')
	const AFTER_KEY_EXPIRED = Date.parse('2060-01-01T00:00:00Z')
	const HIGH_SEQUENCE_NUMBER = 2 ** 40
	let sessionKeys: readonly ValidatedSessionKey[]
	let key: TestSessionKey
	let attackerKey: TestSessionKey
	let impostorKey: TestSessionKey

	before(async () => {
		const signer = await createTestSigner()
		key = await createTestSessionKey('key_001')
		// A key the init segment never publishes, so segments signed with it find no match.
		attackerKey = await createTestSessionKey('key_attacker')
		// A different key pair with the published kid, so segments signed with it match the key but fail the signature.
		impostorKey = await createTestSessionKey('key_001')
		const init = await buildSessionKeysInitSegment(signer, [
			{ key, minSequenceNumber: 0, createdAt: KEY_CREATED_AT, validityPeriod: KEY_VALIDITY_PERIOD },
		])
		sessionKeys = (await validateC2paInitSegment(init)).sessionKeys
		strictEqual(sessionKeys.length, 1)
	})

	// Validates the first segment and returns the state after it.
	async function afterFirstSegment(): Promise<SequenceState | undefined> {
		const r1 = await validateC2paSegment(await buildVsiSegment(key, 1), sessionKeys)
		strictEqual(r1?.result.isValid, true)
		return r1?.nextSequenceState
	}

	// Flips the first payload byte of the mdat box, which the VSI content hash covers.
	function tamperMedia(segment: Uint8Array): Uint8Array {
		const tampered = new Uint8Array(segment)
		const mdat = Array.from('mdat', c => c.charCodeAt(0))
		for (let i = 4; i + 4 <= tampered.length; i++) {
			if (mdat.every((byte, j) => tampered[i + j] === byte)) {
				tampered[i + 4] ^= 0xff
				return tampered
			}
		}
		throw new Error('no mdat box')
	}

	it('does not strand later segments after an unauthenticated forged high sequence number', async () => {
		const state1 = await afterFirstSegment()

		// An attacker-signed segment with a very high sequence number and an unknown key.
		const forged = await validateC2paSegment(await buildVsiSegment(attackerKey, HIGH_SEQUENCE_NUMBER), sessionKeys, state1)
		strictEqual(forged?.result.isValid, false)

		// The next authentic in-order segment must still validate.
		const r2 = await validateC2paSegment(await buildVsiSegment(key, 2), sessionKeys, forged?.nextSequenceState)
		strictEqual(r2?.result.isValid, true)
		deepStrictEqual(r2?.result.errorCodes, [])
	})

	it('leaves the sequence state unchanged for a segment with no matching session key', async () => {
		const state1 = await afterFirstSegment()

		const forged = await validateC2paSegment(await buildVsiSegment(attackerKey, HIGH_SEQUENCE_NUMBER), sessionKeys, state1)

		deepStrictEqual(forged?.result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
		deepStrictEqual(forged?.nextSequenceState, state1)
	})

	it('leaves the sequence state unchanged for a forged signature under a published kid', async () => {
		const state1 = await afterFirstSegment()

		const forged = await validateC2paSegment(await buildVsiSegment(impostorKey, HIGH_SEQUENCE_NUMBER), sessionKeys, state1)

		strictEqual(forged?.result.kidHex, key.kidHex)
		strictEqual(forged?.result.errorCodes.includes(LiveVideoStatusCode.SEGMENT_INVALID), true)
		deepStrictEqual(forged?.nextSequenceState, state1)
	})

	it('leaves the sequence state unchanged for tampered media with a valid signature', async () => {
		const state1 = await afterFirstSegment()

		const tampered = await validateC2paSegment(tamperMedia(await buildVsiSegment(key, 2)), sessionKeys, state1)

		deepStrictEqual(tampered?.result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
		deepStrictEqual(tampered?.nextSequenceState, state1)
	})

	it('leaves the sequence state unchanged for a segment signed with an expired session key', async (context) => {
		const state1 = await afterFirstSegment()
		context.mock.timers.enable({ apis: ['Date'], now: AFTER_KEY_EXPIRED })

		const expired = await validateC2paSegment(await buildVsiSegment(key, 2), sessionKeys, state1)

		deepStrictEqual(expired?.result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
		deepStrictEqual(expired?.nextSequenceState, state1)
	})

	it('leaves the sequence state unchanged for a segment signed with a session key that is not yet active', async (context) => {
		const state1 = await afterFirstSegment()
		context.mock.timers.enable({ apis: ['Date'], now: BEFORE_KEY_CREATED_AT })

		const early = await validateC2paSegment(await buildVsiSegment(key, 2), sessionKeys, state1)

		deepStrictEqual(early?.result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
		deepStrictEqual(early?.nextSequenceState, state1)
	})

	it('reports SEGMENT_INVALID and leaves the state unchanged below the minSequenceNumber of the key', async () => {
		const minKey = await createTestSessionKey('key_min')
		const init = await buildSessionKeysInitSegment(await createTestSigner(), [
			{ key: minKey, minSequenceNumber: 10, createdAt: KEY_CREATED_AT, validityPeriod: KEY_VALIDITY_PERIOD },
		])
		const keys = (await validateC2paInitSegment(init)).sessionKeys
		const state: SequenceState = { lastSequenceNumber: 12, seenSequences: new Set([12]) }

		const below = await validateC2paSegment(await buildVsiSegment(minKey, 5), keys, state)

		strictEqual(below?.result.sequenceResult.reason, SequenceValidationReason.SEQUENCE_NUMBER_BELOW_MINIMUM)
		deepStrictEqual(below?.result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
		strictEqual(below?.nextSequenceState, state)
	})

	it('accepts an authentic segment after a gap and reports the missing range', async () => {
		const state1 = await afterFirstSegment()

		const r3 = await validateC2paSegment(await buildVsiSegment(key, 3), sessionKeys, state1)
		strictEqual(r3?.result.isValid, true)
		deepStrictEqual(r3?.result.errorCodes, [])
		deepStrictEqual(r3?.result.sequenceResult, { isValid: false, reason: SequenceValidationReason.GAP_DETECTED, missingFrom: 2, missingTo: 2 })
		strictEqual(r3?.nextSequenceState.lastSequenceNumber, 3)

		const r4 = await validateC2paSegment(await buildVsiSegment(key, 4), sessionKeys, r3?.nextSequenceState)
		strictEqual(r4?.result.isValid, true)
	})

	it('does not rewind the floor for an authentic segment that arrives late', async () => {
		let state: SequenceState | undefined
		const reasons = []
		const errorCodes = []

		for (const sequenceNumber of [1, 3, 2, 4]) {
			const validated = await validateC2paSegment(await buildVsiSegment(key, sequenceNumber), sessionKeys, state)
			reasons.push(validated?.result.sequenceResult.reason)
			errorCodes.push(validated?.result.errorCodes)
			state = validated?.nextSequenceState
		}

		deepStrictEqual(reasons, [
			SequenceValidationReason.VALID,
			SequenceValidationReason.GAP_DETECTED,
			SequenceValidationReason.OUT_OF_ORDER,
			SequenceValidationReason.VALID,
		])
		deepStrictEqual(errorCodes, [[], [], [LiveVideoStatusCode.SEGMENT_INVALID], []])
	})

	it('reports SEGMENT_INVALID for a replayed segment', async () => {
		const state1 = await afterFirstSegment()
		const r2 = await validateC2paSegment(await buildVsiSegment(key, 2), sessionKeys, state1)

		const replay = await validateC2paSegment(await buildVsiSegment(key, 2), sessionKeys, r2?.nextSequenceState)

		strictEqual(replay?.result.sequenceResult.reason, SequenceValidationReason.DUPLICATE)
		deepStrictEqual(replay?.result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
	})

	it('accepts the next authentic segment after a tampered segment', async () => {
		const state1 = await afterFirstSegment()
		const tampered = await validateC2paSegment(tamperMedia(await buildVsiSegment(key, 2)), sessionKeys, state1)
		strictEqual(tampered?.result.isValid, false)

		// The tampered segment does not advance the state, so segment 3 follows a gap.
		const r3 = await validateC2paSegment(await buildVsiSegment(key, 3), sessionKeys, tampered?.nextSequenceState)

		strictEqual(r3?.result.sequenceResult.reason, SequenceValidationReason.GAP_DETECTED)
		strictEqual(r3?.result.isValid, true)
	})
})
