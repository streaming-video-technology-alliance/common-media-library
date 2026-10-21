const TEXT_DECODER = /* @__PURE__ */ new TextDecoder()

import { readIsoBoxes, type ParsedIsoBox } from '@svta/cml-iso-bmff'
import { projectCborTags } from './cbor/projectCborTags.ts'
import { decodeCbor } from './cbor/readCborItem.ts'
import type { C2paAssertion } from './C2paAssertion.ts'
import type { C2paManifest } from './C2paManifest.ts'
import { C2paStatusCode } from './C2paStatusCode.ts'
import type { ClaimAssertionRef } from './claim/ClaimAssertionRef.ts'
import type { InternalAssertionData, InternalManifestData } from './claim/InternalManifestData.ts'
import { decodeCoseSign1 } from './cose/decodeCoseSign1.ts'
import type { JumbfBox } from './jumbf/JumbfBox.ts'
import { parseJumbfBoxes } from './jumbf/parseJumbfBoxes.ts'
import { parseJumbfLabel } from './jumbf/parseJumbfLabel.ts'
import { asString, findC2paUuidBox, stripJumbfUuidPrefix } from './utils.ts'
import { extractCertificateInfo } from './x509/extractCertificateInfo.ts'


const MAX_JUMBF_NESTING_DEPTH = 20
const X5CHAIN_HEADER_LABEL = 33

function resolveManifestBoxes(jumbfBoxes: JumbfBox[], depth = 0): JumbfBox[] {
	if (depth >= MAX_JUMBF_NESTING_DEPTH) return jumbfBoxes

	// Skip jumd description boxes — they contain labels, not manifest content
	const contentBoxes = jumbfBoxes.filter(b => b.type !== 'jumd')

	// Single jumb wrapping — unwrap one level and recurse
	// This handles: store jumb → manifest jumb → claim/assertions/signature
	const firstBox = contentBoxes[0]
	if (contentBoxes.length === 1 && firstBox?.type === 'jumb') {
		return resolveManifestBoxes(parseJumbfBoxes(firstBox.data), depth + 1)
	}

	return jumbfBoxes
}

const JUMBF_URI_PREFIX = 'self#jumbf='
const SIGNATURE_BOX_LABEL = 'c2pa.signature'

type SignatureReference = {
	/** The claim `signature` URI resolves to the signature box of this manifest (§15.7) */
	readonly resolves: boolean
	/** The URI names the JUMBF label of this manifest, so the claim signature covers the label */
	readonly namesLabel: boolean
}

// §8.4.2.1: the claim `signature` field is a JUMBF URI. A URI that starts with a slash is relative to the
// manifest store and names the JUMBF label of the manifest. Any other URI is relative to the current manifest.
function resolveSignatureReference(label: string | null, claimData: Record<string, unknown>): SignatureReference {
	const uri = asString(claimData['signature'])
	if (!uri?.startsWith(JUMBF_URI_PREFIX)) return { resolves: false, namesLabel: false }
	const path = uri.slice(JUMBF_URI_PREFIX.length)
	if (path === SIGNATURE_BOX_LABEL) return { resolves: true, namesLabel: false }
	const namesLabel = label !== null && path === `/c2pa/${label}/${SIGNATURE_BOX_LABEL}`
	return { resolves: namesLabel, namesLabel }
}

function extractManifestLabel(jumbfBoxes: JumbfBox[]): string | null {
	// Navigate: store jumb → manifest jumb → jumd label
	for (const box of jumbfBoxes) {
		if (box.type !== 'jumb') continue
		const inner = parseJumbfBoxes(box.data)
		for (const child of inner) {
			if (child.type !== 'jumb') continue
			const childInner = parseJumbfBoxes(child.data)
			const jumd = childInner.find(b => b.type === 'jumd')
			if (jumd) {
				const label = parseJumbfLabel(jumd.data)
				if (label) return label
			}
		}
	}
	return null
}

function parseAssertionsInternal(assertionStoreBoxes: JumbfBox[]): InternalAssertionData[] {
	const assertions: InternalAssertionData[] = []

	for (const box of assertionStoreBoxes) {
		if (box.type !== 'jumb') continue
		const inner = parseJumbfBoxes(box.data)

		const jumd = inner.find(b => b.type === 'jumd')
		if (!jumd) continue

		const label = parseJumbfLabel(jumd.data)
		if (!label) continue

		const contentBox = inner.find(
			b => b.type === 'cbor' || b.type === 'json' || b.type === 'jumc' || b.type === 'jp2c' || b.type === 'bidb',
		)

		let data: unknown = null
		let taggedData: unknown
		if (contentBox) {
			if (contentBox.type === 'cbor') {
				try {
					taggedData = decodeCbor(contentBox.data)
					data = projectCborTags(taggedData)
				} catch {
					data = contentBox.data
				}
			}
			else if (contentBox.type === 'json') {
				try { data = JSON.parse(TEXT_DECODER.decode(contentBox.data)) as unknown } catch { data = contentBox.data }
			}
			else {
				data = contentBox.data
			}
		}

		assertions.push({ label, data, rawBoxPayload: box.data, taggedData })
	}

	return assertions
}

function parseSignatureInfo(signatureBytes: Uint8Array | null): { issuer: string | null; certNotBefore: string | null } {
	if (!signatureBytes) return { issuer: null, certNotBefore: null }
	try {
		const cose = decodeCoseSign1(signatureBytes)
		const x5chain = (cose.protectedHeader[X5CHAIN_HEADER_LABEL] ?? cose.unprotectedHeader[X5CHAIN_HEADER_LABEL]) as Uint8Array | Uint8Array[] | null | undefined
		if (!x5chain) return { issuer: null, certNotBefore: null }

		const certDER = Array.isArray(x5chain) ? x5chain[0] : x5chain
		if (!(certDER instanceof Uint8Array)) return { issuer: null, certNotBefore: null }

		const certInfo = extractCertificateInfo(certDER)
		return { issuer: certInfo?.issuer ?? null, certNotBefore: certInfo?.notBefore ?? null }
	} catch {
		// signature parsing failed — continue without signature info
		return { issuer: null, certNotBefore: null }
	}
}

type Claim = {
	readonly data: Record<string, unknown> | null
	readonly code: InternalManifestData['claimCode']
}

// C2PA section 15.6.2: the claim box holds one CBOR map
function readClaim(bytes: Uint8Array): Claim {
	let value: unknown
	try {
		value = decodeCbor(bytes)
	} catch {
		return { data: null, code: C2paStatusCode.CLAIM_CBOR_INVALID }
	}
	if (value === null || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) {
		return { data: null, code: C2paStatusCode.CLAIM_MALFORMED }
	}
	return { data: projectCborTags(value) as Record<string, unknown>, code: null }
}

function extractClaimAssertionRefs(claimData: Record<string, unknown>): ClaimAssertionRef[] {
	const created = claimData['created_assertions'] as unknown[] | undefined
	const gathered = claimData['gathered_assertions'] as unknown[] | undefined
	const v1 = claimData['assertions'] as unknown[] | undefined

	const sources = [...(created ?? []), ...(gathered ?? []), ...(v1 ?? [])]
	const refs: ClaimAssertionRef[] = []

	for (const entry of sources) {
		if (!entry || typeof entry !== 'object') continue
		const e = entry as Record<string, unknown>
		const url = e['url'] as string | undefined
		const hash = e['hash']
		if (!url || hash == null) continue

		refs.push({
			url,
			// hashed-uri-map CDDL: hash is a byte string. Another type never matches.
			hash: hash instanceof Uint8Array ? hash : new Uint8Array(0),
			alg: (e['alg'] as string | undefined) ?? null,
		})
	}

	return refs
}

/**
 * Reads a C2PA manifest from raw BMFF bytes.
 *
 * Locates the C2PA UUID box (`d8fec3d6-1a96-4f32-a0f6-f3ecf96c10ea`), navigates
 * the JUMBF manifest store structure (ISO 19566-5), and returns the parsed active
 * manifest with its claims, assertions, and signature information.
 *
 * This function performs structural parsing only. It does not verify the
 * cryptographic signature of the claim.
 *
 * @param bytes - Raw BMFF bytes (e.g. an MP4 init segment or media segment)
 * @param preParsedBoxes - Optional pre-parsed ISO boxes to avoid redundant parsing
 * @returns The parsed manifest data including claim, assertions, and signature bytes
 * @throws If no C2PA UUID box is found, or the JUMBF structure is invalid
 *
 * @example
 * {@includeCode ../test/readC2paManifest.test.ts#example}
 *
 * @internal
 */
export function readC2paManifest(bytes: Uint8Array, preParsedBoxes?: ParsedIsoBox[]): InternalManifestData {
	const boxes = preParsedBoxes ?? readIsoBoxes(bytes)
	const uuidBox = findC2paUuidBox(boxes)

	if (!uuidBox) {
		throw new Error('No C2PA UUID box found in the provided bytes')
	}

	const rawPayload = uuidBox.view.readData(uuidBox.view.bytesRemaining) as Uint8Array
	const jumbfPayload = stripJumbfUuidPrefix(rawPayload)
	if (!jumbfPayload) {
		throw new Error('Invalid JUMBF UUID prefix in C2PA box')
	}
	const jumbfBoxes = parseJumbfBoxes(jumbfPayload)

	if (jumbfBoxes.length === 0) {
		throw new Error('No JUMBF boxes found in C2PA UUID box')
	}

	const manifestLabel = extractManifestLabel(jumbfBoxes)
	const manifestBoxes = resolveManifestBoxes(jumbfBoxes)

	let claimData: Record<string, unknown> | null = null
	let claimCborBytes: Uint8Array | null = null
	let claimCode: InternalManifestData['claimCode'] = null
	let internalAssertions: InternalAssertionData[] = []
	let signatureBytes: Uint8Array | null = null
	let claimBoxes = 0
	let assertionStores = 0
	let signatureBoxes = 0

	for (const box of manifestBoxes) {
		if (box.type !== 'jumb') continue

		const inner = parseJumbfBoxes(box.data)
		const jumd = inner.find(b => b.type === 'jumd')
		if (!jumd) continue

		const label = parseJumbfLabel(jumd.data)
		if (!label) continue

		if (label === 'c2pa.claim' || label === 'c2pa.claim.v2') {
			claimBoxes++
			const contentBox = inner.find(b => b.type === 'cbor')
			if (contentBox) {
				claimCborBytes = contentBox.data
				const claim = readClaim(contentBox.data)
				claimData = claim.data
				claimCode = claim.code
			}
		}
		else if (label === 'c2pa.assertions') {
			assertionStores++
			internalAssertions = parseAssertionsInternal(inner)
		}
		else if (label === 'c2pa.signature') {
			signatureBoxes++
			const contentBox = inner.find(b => b.type === 'cbor' || b.type === 'jumc')
			if (contentBox) signatureBytes = contentBox.data
		}
	}

	// §15.6.1: a manifest has one claim box. §8.4.1: a label that appears twice is ambiguous, so
	// the signature URI and every assertion URI of the claim are unresolved.
	if (claimBoxes > 1) {
		claimData = null
		claimCborBytes = null
		claimCode = C2paStatusCode.CLAIM_MULTIPLE
	}
	if (assertionStores > 1) internalAssertions = []
	if (signatureBoxes > 1) signatureBytes = null

	const { issuer, certNotBefore } = parseSignatureInfo(signatureBytes)

	const instanceId = asString(claimData?.['instanceID'] ?? claimData?.['instance_id'])
	const claimGenerator = asString(claimData?.['claim_generator'] ?? claimData?.['claimGenerator'])
	const resolvedLabel =
		manifestLabel ??
		asString(claimData?.['dc:title']) ??
		asString(claimData?.['title']) ??
		instanceId ??
		'unknown'

	const claimAssertionRefs = claimData ? extractClaimAssertionRefs(claimData) : []

	const assertions: C2paAssertion[] = internalAssertions.map(a => ({ label: a.label, data: a.data }))

	// The JUMBF label is outside the signed claim. The label counts as the manifest identifier only when the
	// signed `signature` URI names it, so a changed label cannot take the identity of another manifest.
	const signatureReference = claimData ? resolveSignatureReference(manifestLabel, claimData) : null

	const manifest: C2paManifest = {
		label: resolvedLabel,
		instanceId,
		claimGenerator,
		signatureInfo: { issuer, certNotBefore },
		assertions,
	}

	return {
		manifest,
		manifestId: signatureReference?.namesLabel ? manifestLabel : null,
		claimAssertionRefs,
		claimCborBytes,
		claimCode,
		signatureUriCode: signatureReference && !signatureReference.resolves ? C2paStatusCode.CLAIM_SIGNATURE_MISSING : null,
		signatureBytes,
		assertions: internalAssertions,
	}
}

