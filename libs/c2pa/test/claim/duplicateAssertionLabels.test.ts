import { validateC2paInitSegment, validateC2paManifestBoxSegment, C2paStatusCode, LiveVideoStatusCode } from '@svta/cml-c2pa'
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { before, describe, it } from 'node:test'
import { Tag } from 'cbor-x'
import { computeBmffHash } from '../../src/bmff/computeBmffHash.ts'
import { JUMBF_UUID } from '../../src/utils.ts'
import { encodeCbor } from '../cborTestUtils.ts'
import {
	buildBox,
	buildInitMediaBoxes,
	buildJumb,
	buildMediaContent,
	buildUuidBox,
	concatBytes,
	sha256,
} from '../merkle/merkleTestUtils.ts'
import { createTestSigner, type TestSigner } from '../testSigner.ts'
import { createTestSessionKey, encodeSignerBinding, type TestSessionKey } from '../vsi/vsiTestUtils.ts'

// Manifests whose assertion store or manifest box holds more than one box with the same label,
// or an assertion the claim does not reference. C2PA 2.4 section 8.4.1 (an ambiguous label is
// unresolved), section 9.1 (at most one hard binding), section 15.6.1 (one claim box), and
// section 15.10.3.1 (every assertion is declared). The validators must reject the manifest and
// must not expose session keys or merkle maps from it.

const SESSION_KEYS_LABEL = 'c2pa.session-keys'
const BMFF_LABEL = 'c2pa.hash.bmff.v3'
const LIVE_VIDEO_LABEL = 'c2pa.livevideo.segment'
const MANIFEST_ID = 'urn:uuid:dup-label-test'
const PREVIOUS_MANIFEST_ID = 'urn:uuid:dup-label-prev'

const CBOR_TAG_DATE_TIME = 0

type AssertionRef = { readonly label: string; readonly box: Uint8Array }

// One session key entry (§18.25.2). The signer binding is signed with the session key over
// `bindingPayload`, which is the signer's end-entity certificate for a valid binding.
async function sessionKeyEntry(key: TestSessionKey, bindingPayload: Uint8Array): Promise<Record<string, unknown>> {
	return {
		key: key.coseKey,
		minSequenceNumber: 0,
		createdAt: new Tag(new Date(Date.now() - 60_000).toISOString(), CBOR_TAG_DATE_TIME),
		validityPeriod: 86_400,
		signerBinding: await encodeSignerBinding(key, bindingPayload),
	}
}

function sessionKeysBoxOf(entries: readonly Record<string, unknown>[]): Uint8Array {
	return buildJumb(SESSION_KEYS_LABEL, buildBox('cbor', encodeCbor({ keys: entries })))
}

async function buildSessionKeysBox(key: TestSessionKey, certificateDER: Uint8Array): Promise<Uint8Array> {
	return sessionKeysBoxOf([await sessionKeyEntry(key, certificateDER)])
}

// An assertion that no claim in these tests references.
function undeclaredBox(): Uint8Array {
	return buildJumb('com.example.extra', buildBox('cbor', encodeCbor({ a: 1 })))
}

function buildBmffFlatBox(hash: Uint8Array): Uint8Array {
	return buildJumb(BMFF_LABEL, buildBox('cbor', encodeCbor({ exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash })))
}

function buildBmffMerkleBox(root: Uint8Array, initHash: Uint8Array): Uint8Array {
	return buildJumb(BMFF_LABEL, buildBox('cbor', encodeCbor({
		exclusions: [{ xpath: '/uuid' }],
		alg: 'sha256',
		merkle: [{ uniqueId: 1, localId: 1, count: 1, hashes: [root], initHash, alg: 'sha256' }],
	})))
}

function buildLiveVideoBox(sequenceNumber: number): Uint8Array {
	return buildJumb(LIVE_VIDEO_LABEL, buildBox('cbor', encodeCbor({
		sequenceNumber,
		streamId: 'stream-1',
		continuityMethod: 'c2pa.manifestId',
		previousManifestId: PREVIOUS_MANIFEST_ID,
	})))
}

// Wraps manifest child boxes, in the given order, in a manifest store appended to `mediaBoxes`.
function wrapManifest(mediaBoxes: Uint8Array, ...children: readonly Uint8Array[]): Uint8Array {
	const manifest = buildJumb(MANIFEST_ID, ...children)
	const purpose = new TextEncoder().encode('manifest')
	const prefix = new Uint8Array(4 + purpose.length + 1 + 8)
	prefix.set(purpose, 4)
	return concatBytes(mediaBoxes, buildUuidBox(JUMBF_UUID, concatBytes(prefix, buildJumb('c2pa', manifest))))
}

type ClaimOptions = {
	/** The `instanceID` of the claim. */
	readonly instanceId?: string
	/** The JUMBF label of the claim box: `c2pa.claim` (default) or `c2pa.claim.v2`. */
	readonly claimLabel?: string
	/** The claim field that lists the references: `created_assertions` (default) or the v1 `assertions`. */
	readonly refsField?: 'created_assertions' | 'assertions'
}

// The claim box that references `claimRefs` by hash, in order, and the signature box over that claim.
async function signedClaimBoxes(
	claimRefs: readonly AssertionRef[],
	signer: TestSigner,
	options: ClaimOptions = {},
): Promise<{ readonly claim: Uint8Array; readonly signature: Uint8Array }> {
	const refs = await Promise.all(claimRefs.map(async ref => ({
		url: `self#jumbf=c2pa.assertions/${ref.label}`,
		hash: await sha256(ref.box.subarray(8)),
		alg: 'sha256',
	})))
	const claimBytes = encodeCbor({ instanceID: options.instanceId ?? MANIFEST_ID, [options.refsField ?? 'created_assertions']: refs })
	return {
		claim: buildJumb(options.claimLabel ?? 'c2pa.claim', buildBox('cbor', claimBytes)),
		signature: buildJumb('c2pa.signature', buildBox('cbor', await signer.sign(claimBytes))),
	}
}

// Wraps an ordered assertion store in a signed manifest. The claim references only `claimRefs`
// by hash, in order. `storeBoxes` is the actual on-disk order, which may contain extra boxes.
async function assembleSegment(
	mediaBoxes: Uint8Array,
	storeBoxes: readonly Uint8Array[],
	claimRefs: readonly AssertionRef[],
	signer: TestSigner,
): Promise<Uint8Array> {
	const { claim, signature } = await signedClaimBoxes(claimRefs, signer)
	return wrapManifest(mediaBoxes, claim, buildJumb('c2pa.assertions', ...storeBoxes), signature)
}

describe('duplicate assertion labels (security)', () => {
	let signer: TestSigner
	let legitKey: TestSessionKey
	let attackerKey: TestSessionKey

	before(async () => {
		signer = await createTestSigner()
		legitKey = await createTestSessionKey('legit')
		attackerKey = await createTestSessionKey('attacker')
	})

	// #region example
	it('rejects a prepended duplicate c2pa.session-keys box and exposes no attacker key', async () => {
		const legitBox = await buildSessionKeysBox(legitKey, signer.certificateDER)
		const attackerBox = await buildSessionKeysBox(attackerKey, signer.certificateDER)
		// The claim references the legit box; the attacker box is prepended into the store.
		const init = await assembleSegment(buildInitMediaBoxes(), [attackerBox, legitBox], [{ label: SESSION_KEYS_LABEL, box: legitBox }], signer)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_MISSING))
		// A duplicated label is ambiguous, not undeclared: the claim references that label.
		strictEqual(result.errorCodes.includes(C2paStatusCode.ASSERTION_UNDECLARED), false)
		deepStrictEqual(result.sessionKeys.map(k => k.kid), [])
	})
	// #endregion example

	it('rejects a substituted (not claim-referenced) c2pa.session-keys box', async () => {
		const legitBox = await buildSessionKeysBox(legitKey, signer.certificateDER)
		const attackerBox = await buildSessionKeysBox(attackerKey, signer.certificateDER)
		// The claim references the legit box bytes, but only the attacker box is present.
		const init = await assembleSegment(buildInitMediaBoxes(), [attackerBox], [{ label: SESSION_KEYS_LABEL, box: legitBox }], signer)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_HASHEDURI_MISMATCH))
		deepStrictEqual(result.sessionKeys.map(k => k.kid), [])
	})

	it('rejects a prepended duplicate c2pa.hash.bmff.v3 box and exposes no attacker merkle maps', async () => {
		const initHash = await computeBmffHash(buildInitMediaBoxes(), { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
		const attackerRoot = await sha256(new TextEncoder().encode('attacker-root'))
		const legitRoot = await sha256(new TextEncoder().encode('legit-root'))
		const attackerBox = buildBmffMerkleBox(attackerRoot, initHash)
		const legitBox = buildBmffMerkleBox(legitRoot, initHash)
		const init = await assembleSegment(buildInitMediaBoxes(), [attackerBox, legitBox], [{ label: BMFF_LABEL, box: legitBox }], signer)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_MULTIPLE_HARD_BINDINGS))
		deepStrictEqual(result.merkleMaps, [])
	})

	it('does not validate tampered manifest-box media behind a duplicate c2pa.hash.bmff.v3', async () => {
		const original = concatBytes(buildBox('styp', new TextEncoder().encode('msdh')), buildMediaContent(1))
		const tampered = concatBytes(buildBox('styp', new TextEncoder().encode('msdh')), buildMediaContent(99))
		const hashOriginal = await computeBmffHash(original, { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
		const hashTampered = await computeBmffHash(tampered, { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
		const live = buildLiveVideoBox(1)
		const attackerBmff = buildBmffFlatBox(hashTampered)
		const legitBmff = buildBmffFlatBox(hashOriginal)
		// Tampered media on disk; claim references the original-media hash box.
		const segment = await assembleSegment(tampered, [live, attackerBmff, legitBmff], [
			{ label: LIVE_VIDEO_LABEL, box: live },
			{ label: BMFF_LABEL, box: legitBmff },
		], signer)

		const { result } = await validateC2paManifestBoxSegment(segment, PREVIOUS_MANIFEST_ID)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_MULTIPLE_HARD_BINDINGS))
		strictEqual(result.bmffHashHex, null)
	})

	it('rejects a prepended duplicate c2pa.livevideo.segment box', async () => {
		const media = concatBytes(buildBox('styp', new TextEncoder().encode('msdh')), buildMediaContent(1))
		const hash = await computeBmffHash(media, { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
		const bmff = buildBmffFlatBox(hash)
		const attackerLive = buildLiveVideoBox(9999)
		const legitLive = buildLiveVideoBox(1)
		const segment = await assembleSegment(media, [attackerLive, legitLive, bmff], [
			{ label: LIVE_VIDEO_LABEL, box: legitLive },
			{ label: BMFF_LABEL, box: bmff },
		], signer)

		const { result, nextState } = await validateC2paManifestBoxSegment(segment, PREVIOUS_MANIFEST_ID)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_MISSING))
		// Neither live-video box is verified, so no forged sequence number reaches the result or the state.
		strictEqual(result.sequenceNumber, null)
		strictEqual(nextState.lastSequenceNumber, undefined)
	})

	it('rejects two different hard-binding assertions with multipleHardBindings', async () => {
		const initHash = await computeBmffHash(buildInitMediaBoxes(), { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
		const bmff = buildBmffFlatBox(initHash)
		const boxesHardBinding = buildJumb('c2pa.hash.boxes', buildBox('cbor', encodeCbor({ alg: 'sha256', hash: initHash })))
		const init = await assembleSegment(buildInitMediaBoxes(), [bmff, boxesHardBinding], [
			{ label: BMFF_LABEL, box: bmff },
			{ label: 'c2pa.hash.boxes', box: boxesHardBinding },
		], signer)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_MULTIPLE_HARD_BINDINGS))
	})

	it('rejects an init segment with a BMFF assertion the claim does not declare', async () => {
		const sessionKeys = await buildSessionKeysBox(legitKey, signer.certificateDER)
		// The BMFF assertion is in the store with a wrong hash, but the claim omits it.
		const bmff = buildBmffFlatBox(new Uint8Array(32))
		const init = await assembleSegment(buildInitMediaBoxes(), [sessionKeys, bmff], [{ label: SESSION_KEYS_LABEL, box: sessionKeys }], signer)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_UNDECLARED))
		deepStrictEqual(result.sessionKeys.map(k => k.kid), [])
	})

	it('does not validate tampered manifest-box media behind an undeclared c2pa.hash.bmff.v3', async () => {
		const original = concatBytes(buildBox('styp', new TextEncoder().encode('msdh')), buildMediaContent(1))
		const tampered = concatBytes(buildBox('styp', new TextEncoder().encode('msdh')), buildMediaContent(99))
		const hashOriginal = await computeBmffHash(original, { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
		const live = buildLiveVideoBox(1)
		const bmff = buildBmffFlatBox(hashOriginal)
		// Tampered media on disk; the claim references only the live-video assertion, omitting BMFF.
		const segment = await assembleSegment(tampered, [live, bmff], [{ label: LIVE_VIDEO_LABEL, box: live }], signer)

		const { result } = await validateC2paManifestBoxSegment(segment, PREVIOUS_MANIFEST_ID)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_UNDECLARED))
		strictEqual(result.bmffHashHex, null)
	})

	it('counts a numbered hard-binding instance in the multiple-hard-bindings check', async () => {
		const initHash = await computeBmffHash(buildInitMediaBoxes(), { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
		const merkleCbor = (root: Uint8Array): Uint8Array => encodeCbor({
			exclusions: [{ xpath: '/uuid' }], alg: 'sha256',
			merkle: [{ uniqueId: 1, localId: 1, count: 1, hashes: [root], initHash, alg: 'sha256' }],
		})
		const bmff = buildJumb(BMFF_LABEL, buildBox('cbor', merkleCbor(await sha256(new TextEncoder().encode('root-0')))))
		// A second hard binding with the §6.4 numbered-instance suffix.
		const bmffInstance = buildJumb(`${BMFF_LABEL}__1`, buildBox('cbor', merkleCbor(await sha256(new TextEncoder().encode('root-1')))))
		const init = await assembleSegment(buildInitMediaBoxes(), [bmff, bmffInstance], [
			{ label: BMFF_LABEL, box: bmff },
			{ label: `${BMFF_LABEL}__1`, box: bmffInstance },
		], signer)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_MULTIPLE_HARD_BINDINGS))
		deepStrictEqual(result.merkleMaps, [])
	})

	// §15.6.1 and §8.4.1: a manifest box label that appears twice is ambiguous. Each case below
	// would validate with the duplicate removed.
	it('rejects a manifest with two claim boxes', async () => {
		const sessionKeys = await buildSessionKeysBox(legitKey, signer.certificateDER)
		const { claim, signature } = await signedClaimBoxes([{ label: SESSION_KEYS_LABEL, box: sessionKeys }], signer)
		const init = wrapManifest(buildInitMediaBoxes(), claim, claim, buildJumb('c2pa.assertions', sessionKeys), signature)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.CLAIM_MULTIPLE))
		deepStrictEqual(result.sessionKeys.map(k => k.kid), [])
	})

	it('rejects a manifest with two signature boxes', async () => {
		const sessionKeys = await buildSessionKeysBox(legitKey, signer.certificateDER)
		const { claim, signature } = await signedClaimBoxes([{ label: SESSION_KEYS_LABEL, box: sessionKeys }], signer)
		const init = wrapManifest(buildInitMediaBoxes(), claim, buildJumb('c2pa.assertions', sessionKeys), signature, signature)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISSING))
		deepStrictEqual(result.sessionKeys.map(k => k.kid), [])
	})

	it('rejects a manifest with two assertion stores', async () => {
		const sessionKeys = await buildSessionKeysBox(legitKey, signer.certificateDER)
		const { claim, signature } = await signedClaimBoxes([{ label: SESSION_KEYS_LABEL, box: sessionKeys }], signer)
		const store = buildJumb('c2pa.assertions', sessionKeys)
		const init = wrapManifest(buildInitMediaBoxes(), claim, store, store, signature)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_MISSING))
		deepStrictEqual(result.sessionKeys.map(k => k.kid), [])
	})

	it('reads nothing from either claim of a manifest-box segment with two claim boxes', async () => {
		const media = concatBytes(buildBox('styp', new TextEncoder().encode('msdh')), buildMediaContent(1))
		const hash = await computeBmffHash(media, { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
		const live = buildLiveVideoBox(5)
		const bmff = buildBmffFlatBox(hash)
		const refs = [{ label: LIVE_VIDEO_LABEL, box: live }, { label: BMFF_LABEL, box: bmff }]
		const first = await signedClaimBoxes(refs, signer, { instanceId: 'urn:uuid:first-claim' })
		const last = await signedClaimBoxes(refs, signer, { instanceId: 'urn:uuid:last-claim' })
		const segment = wrapManifest(media, first.claim, last.claim, buildJumb('c2pa.assertions', live, bmff), last.signature)

		const { result, nextManifestId, nextState } = await validateC2paManifestBoxSegment(segment, PREVIOUS_MANIFEST_ID)

		deepStrictEqual(result.errorCodes.filter(code => code.startsWith('claim')), [C2paStatusCode.CLAIM_MULTIPLE])
		strictEqual(result.manifest?.instanceId, null)
		strictEqual(result.sequenceNumber, null)
		strictEqual(result.bmffHashHex, null)
		strictEqual(nextManifestId, PREVIOUS_MANIFEST_ID)
		strictEqual(nextState.lastSequenceNumber, undefined)
		strictEqual(nextState.lastStreamId, undefined)
	})

	for (const [description, labels] of [
		['two c2pa.claim.v2 boxes', ['c2pa.claim.v2', 'c2pa.claim.v2']],
		['a c2pa.claim box and a c2pa.claim.v2 box', ['c2pa.claim', 'c2pa.claim.v2']],
	] as const) {
		it(`rejects a manifest with ${description}`, async () => {
			const sessionKeys = await buildSessionKeysBox(legitKey, signer.certificateDER)
			const refs = [{ label: SESSION_KEYS_LABEL, box: sessionKeys }]
			const first = await signedClaimBoxes(refs, signer, { claimLabel: labels[0] })
			const second = await signedClaimBoxes(refs, signer, { claimLabel: labels[1] })
			const init = wrapManifest(buildInitMediaBoxes(), first.claim, second.claim, buildJumb('c2pa.assertions', sessionKeys), first.signature)

			const result = await validateC2paInitSegment(init)

			strictEqual(result.isValid, false)
			ok(result.errorCodes.includes(C2paStatusCode.CLAIM_MULTIPLE))
		})
	}

	it('still reports SESSIONKEY_INVALID for a bad session key when another integrity check fails', async () => {
		const good = await sessionKeyEntry(legitKey, signer.certificateDER)
		const bad = await sessionKeyEntry(attackerKey, new Uint8Array([1, 2, 3]))
		const sessionKeys = sessionKeysBoxOf([good, bad])
		const init = await assembleSegment(buildInitMediaBoxes(), [sessionKeys, undeclaredBox()], [{ label: SESSION_KEYS_LABEL, box: sessionKeys }], signer)

		const result = await validateC2paInitSegment(init)

		ok(result.errorCodes.includes(LiveVideoStatusCode.SESSIONKEY_INVALID))
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_UNDECLARED))
		deepStrictEqual(result.sessionKeys, [])
	})

	it('does not report SESSIONKEY_INVALID for valid session keys that another integrity check withholds', async () => {
		const sessionKeys = await buildSessionKeysBox(legitKey, signer.certificateDER)
		const init = await assembleSegment(buildInitMediaBoxes(), [sessionKeys, undeclaredBox()], [{ label: SESSION_KEYS_LABEL, box: sessionKeys }], signer)

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.errorCodes, [C2paStatusCode.ASSERTION_UNDECLARED])
		deepStrictEqual(result.sessionKeys, [])
	})

	it('accepts a v1 claim that lists its references in the assertions field', async () => {
		const sessionKeys = await buildSessionKeysBox(legitKey, signer.certificateDER)
		const { claim, signature } = await signedClaimBoxes([{ label: SESSION_KEYS_LABEL, box: sessionKeys }], signer, { refsField: 'assertions' })
		const init = wrapManifest(buildInitMediaBoxes(), claim, buildJumb('c2pa.assertions', sessionKeys), signature)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, true)
		deepStrictEqual(result.errorCodes, [])
		deepStrictEqual(result.sessionKeys.map(k => k.kid), [legitKey.kidHex])
	})
})
