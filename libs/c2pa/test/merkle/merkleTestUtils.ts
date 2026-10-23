import { encodeCbor } from '../cborTestUtils.ts'
import { JUMBF_UUID } from '../../src/utils.ts'
import type { TestSigner } from '../testSigner.ts'

const TEXT_ENCODER = new TextEncoder()

const MERKLE_BOX_PURPOSE = 'merkle'

export function concatBytes(...parts: readonly Uint8Array[]): Uint8Array {
	const total = parts.reduce((sum, p) => sum + p.length, 0)
	const out = new Uint8Array(total)
	let offset = 0
	for (const part of parts) {
		out.set(part, offset)
		offset += part.length
	}
	return out
}

export function buildBox(type: string, payload: Uint8Array = new Uint8Array(0)): Uint8Array {
	const size = 8 + payload.length
	const box = new Uint8Array(size)
	new DataView(box.buffer).setUint32(0, size, false)
	for (let i = 0; i < 4; i++) box[4 + i] = type.charCodeAt(i)
	box.set(payload, 8)
	return box
}

export function buildUuidBox(usertype: readonly number[], payload: Uint8Array): Uint8Array {
	return buildBox('uuid', concatBytes(new Uint8Array(usertype), payload))
}

/**
 * Builds a box with a 64-bit `largesize` header (ISO/IEC 14496-12 section 4.2): a size field of 1,
 * the type, and the 8-byte largesize. `largesize` defaults to the box length.
 */
export function buildLargesizeBox(
	type: string,
	payload: Uint8Array = new Uint8Array(0),
	largesize: number = 16 + payload.length,
): Uint8Array {
	const box = new Uint8Array(16 + payload.length)
	const view = new DataView(box.buffer)
	view.setUint32(0, 1, false)
	for (let i = 0; i < 4; i++) box[4 + i] = type.charCodeAt(i)
	view.setBigUint64(8, BigInt(largesize), false)
	box.set(payload, 16)
	return box
}

/** The 8-byte big-endian box offset that prefixes each root box in the §18.6.2 hash input. */
export function encodeBoxOffset(offset: number): Uint8Array {
	const bytes = new Uint8Array(8)
	new DataView(bytes.buffer).setBigUint64(0, BigInt(offset), false)
	return bytes
}

// --- Merkle tree construction (mirrors §15.12.2 balanced binary tree) ---

export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>))
}

async function hashPair(left: Uint8Array, right: Uint8Array): Promise<Uint8Array> {
	return sha256(concatBytes(left, right))
}

// Builds all levels of the tree, leaf level first; null entries are rightmost padding.
export async function buildTreeLevels(
	leaves: readonly Uint8Array[],
): Promise<(Uint8Array | null)[][]> {
	const depth = leaves.length > 1 ? Math.ceil(Math.log2(leaves.length)) : 0
	const level: (Uint8Array | null)[] = [...leaves]
	while (level.length < 2 ** depth) level.push(null)

	const levels: (Uint8Array | null)[][] = [level]
	let current = level
	while (current.length > 1) {
		const next: (Uint8Array | null)[] = []
		for (let i = 0; i < current.length; i += 2) {
			const left = current[i]
			const right = current[i + 1] ?? null
			next.push(left && right ? await hashPair(left, right) : (left ?? right))
		}
		levels.push(next)
		current = next
	}
	return levels
}

// Row as stored in the manifest: the level's nodes with null padding excluded.
export function manifestRow(
	levels: readonly (readonly (Uint8Array | null)[])[],
	level: number,
): Uint8Array[] {
	return (levels[level] ?? []).filter((node): node is Uint8Array => node !== null)
}

// Sibling proof path for a leaf, up to (excluding) the committed level.
export function buildProofPath(
	levels: readonly (readonly (Uint8Array | null)[])[],
	leafIndex: number,
	committedLevel: number,
): (Uint8Array | null)[] {
	const path: (Uint8Array | null)[] = []
	let index = leafIndex
	for (let level = 0; level < committedLevel; level++) {
		const row = levels[level]
		path.push((index % 2 === 0 ? row[index + 1] : row[index - 1]) ?? null)
		index = Math.floor(index / 2)
	}
	return path
}

// --- Segment fixtures ---

export type AuxBoxFields = {
	uniqueId: number
	localId: number
	location: number
	hashes?: readonly (Uint8Array | null)[]
}

// §A.5.1.2/A.5.4.1.4 aux box: version/flags + purpose\0 + CBOR with string keys.
// `paddingBytes` simulates the fixed-size padding §A.5.4.1.4 requires when
// multiple boxes for one Merkle tree share a file.
export function buildMerkleAuxBox(
	fields: AuxBoxFields,
	purpose: string = MERKLE_BOX_PURPOSE,
	paddingBytes: number = 0,
): Uint8Array {
	const map: Record<string, unknown> = {
		uniqueId: fields.uniqueId,
		localId: fields.localId,
		location: fields.location,
	}
	if (fields.hashes) map['hashes'] = fields.hashes

	const purposeBytes = TEXT_ENCODER.encode(purpose)
	const prefix = new Uint8Array(4 + purposeBytes.length + 1) // version/flags + purpose\0
	prefix.set(purposeBytes, 4)
	return buildUuidBox(
		JUMBF_UUID,
		concatBytes(prefix, encodeCbor(map) as Uint8Array, new Uint8Array(paddingBytes)),
	)
}

// Aux box with the right prefix but undecodable CBOR data, for malformed-payload tests.
export function buildMalformedMerkleAuxBox(purpose: string = MERKLE_BOX_PURPOSE): Uint8Array {
	const purposeBytes = TEXT_ENCODER.encode(purpose)
	const prefix = new Uint8Array(4 + purposeBytes.length + 1)
	prefix.set(purposeBytes, 4)
	return buildUuidBox(JUMBF_UUID, concatBytes(prefix, new Uint8Array([0xff, 0xff])))
}

export function buildMediaContent(seed: number): Uint8Array {
	return concatBytes(buildBox('moof'), buildBox('mdat', new Uint8Array([seed, seed + 1, seed + 2])))
}

// --- Init segment fixture (JUMBF manifest with c2pa.hash.bmff.v3 assertion) ---

function buildJumd(label: string): Uint8Array {
	const labelBytes = TEXT_ENCODER.encode(label)
	const data = new Uint8Array(16 + 1 + labelBytes.length + 1)
	data[16] = 0x03 // toggles: requestable + label present
	data.set(labelBytes, 17)
	return buildBox('jumd', data)
}

export function buildJumb(label: string, ...content: readonly Uint8Array[]): Uint8Array {
	return buildBox('jumb', concatBytes(buildJumd(label), ...content))
}

// The claim `signature` field: the absolute URI of the signature box, which names the manifest label (§8.4.2.1).
export function signatureUri(manifestLabel: string): string {
	return `self#jumbf=/c2pa/${manifestLabel}/c2pa.signature`
}

export function buildInitMediaBoxes(): Uint8Array {
	return concatBytes(buildBox('ftyp', TEXT_ENCODER.encode('isom')), buildBox('moov'))
}

const MERKLE_MANIFEST_ID = 'urn:uuid:merkle-test-manifest'
const BMFF_HASH_LABEL = 'c2pa.hash.bmff.v3'

// The claim declares the single bmff hash assertion by hash, so it lands in the validator's
// claim-verified assertion set. A validator reads the assertion only from that set.
async function assembleMerkleInitSegment(
	assertionData: Record<string, unknown>,
	sign: ((claimCborBytes: Uint8Array) => Promise<Uint8Array>) | null,
): Promise<Uint8Array> {
	const bmffAssertion = buildJumb(BMFF_HASH_LABEL, buildBox('cbor', encodeCbor(assertionData)))
	const assertionStore = buildJumb('c2pa.assertions', bmffAssertion)
	const claimCborBytes = encodeCbor({
		instanceID: MERKLE_MANIFEST_ID,
		signature: signatureUri(MERKLE_MANIFEST_ID),
		created_assertions: [
			{
				url: `self#jumbf=c2pa.assertions/${BMFF_HASH_LABEL}`,
				hash: await sha256(bmffAssertion.subarray(8)),
				alg: 'sha256',
			},
		],
	})
	const claim = buildJumb('c2pa.claim', buildBox('cbor', claimCborBytes))
	const manifestContent = [claim, assertionStore]
	if (sign)
		manifestContent.push(buildJumb('c2pa.signature', buildBox('cbor', await sign(claimCborBytes))))
	const manifestJumb = buildJumb(MERKLE_MANIFEST_ID, ...manifestContent)
	const store = buildJumb('c2pa', manifestJumb)

	const purpose = TEXT_ENCODER.encode('manifest')
	const prefix = new Uint8Array(4 + purpose.length + 1 + 8) // fullbox header + purpose\0 + aux offset
	prefix.set(purpose, 4)
	const uuidBox = buildUuidBox(JUMBF_UUID, concatBytes(prefix, store))

	return concatBytes(buildInitMediaBoxes(), uuidBox)
}

// Unsigned init segment with a `c2pa.hash.bmff.v3` assertion. It has no signature box, so
// validation reports CLAIM_SIGNATURE_MISSING next to the codes a test asserts on.
export async function buildMerkleInitSegment(
	assertionData: Record<string, unknown>,
): Promise<Uint8Array> {
	return assembleMerkleInitSegment(assertionData, null)
}

// Init segment with a `c2pa.hash.bmff.v3` assertion and a claim signed by `signer`.
export async function buildSignedMerkleInitSegment(
	assertionData: Record<string, unknown>,
	signer: Pick<TestSigner, 'sign'>,
): Promise<Uint8Array> {
	return assembleMerkleInitSegment(assertionData, claimCborBytes => signer.sign(claimCborBytes))
}
