import { readIsoBoxes } from '@svta/cml-iso-bmff'
import { decode } from 'cbor-x'
import type { C2paAssertion } from './C2paAssertion.ts'
import type { C2paManifest, C2paManifestStore } from './C2paManifest.ts'
import { decodeCoseSign1 } from './cose/decodeCoseSign1.ts'
import type { JumbfBox } from './jumbf/JumbfBox.ts'
import { parseJumbfBoxes } from './jumbf/parseJumbfBoxes.ts'
import { parseJumbfLabel } from './jumbf/parseJumbfLabel.ts'
import { findC2paUuidBox, stripJumbfUuidPrefix } from './utils.ts'
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

function parseAssertions(assertionStoreBoxes: JumbfBox[]): C2paAssertion[] {
	const assertions: C2paAssertion[] = []

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
		if (contentBox) {
			if (contentBox.type === 'cbor') {
				try { data = decode(contentBox.data) as unknown } catch { data = contentBox.data }
			}
			else if (contentBox.type === 'json') {
				try { data = JSON.parse(new TextDecoder().decode(contentBox.data)) as unknown } catch { data = contentBox.data }
			}
			else {
				data = contentBox.data
			}
		}

		assertions.push({ label, data })
	}

	return assertions
}

function parseSignatureInfo(signatureBytes: Uint8Array | null): { issuer: string | null; signingTime: string | null } {
	if (!signatureBytes) return { issuer: null, signingTime: null }
	try {
		const cose = decodeCoseSign1(signatureBytes)
		const x5chain = (cose.protectedHeader[X5CHAIN_HEADER_LABEL] ?? cose.unprotectedHeader[X5CHAIN_HEADER_LABEL]) as Uint8Array | Uint8Array[] | null | undefined
		if (!x5chain) return { issuer: null, signingTime: null }

		const certDER = Array.isArray(x5chain) ? x5chain[0] : x5chain
		if (!(certDER instanceof Uint8Array)) return { issuer: null, signingTime: null }

		const certInfo = extractCertificateInfo(certDER)
		return { issuer: certInfo?.issuer ?? null, signingTime: certInfo?.notBefore ?? null }
	} catch {
		// signature parsing failed — continue without signature info
		return { issuer: null, signingTime: null }
	}
}

/**
 * Reads a C2PA manifest store from raw BMFF bytes.
 *
 * Locates the C2PA UUID box (`d8fec3d6-1a96-4f32-a0f6-f3ecf96c10ea`), navigates
 * the JUMBF manifest store structure (ISO 19566-5), and returns the parsed active
 * manifest with its claims, assertions, and signature information.
 *
 * This function performs structural parsing only. It does not verify the
 * cryptographic signature of the claim.
 *
 * @param bytes - Raw BMFF bytes (e.g. an MP4 init segment or media segment)
 * @returns The parsed C2PA manifest store
 * @throws If no C2PA UUID box is found, or the JUMBF structure is invalid
 *
 * @example
 * {@includeCode ../test/readC2paManifest.test.ts#example}
 *
 * @internal
 */
export function readC2paManifest(bytes: Uint8Array): C2paManifestStore {
	const boxes = readIsoBoxes(bytes)
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
	let assertions: C2paAssertion[] = []
	let signatureBytes: Uint8Array | null = null

	for (const box of manifestBoxes) {
		if (box.type !== 'jumb') continue

		const inner = parseJumbfBoxes(box.data)
		const jumd = inner.find(b => b.type === 'jumd')
		if (!jumd) continue

		const label = parseJumbfLabel(jumd.data)
		if (!label) continue

		if (label === 'c2pa.claim' || label === 'c2pa.claim.v2') {
			const contentBox = inner.find(b => b.type === 'cbor')
			if (contentBox) {
				try { claimData = decode(contentBox.data) as Record<string, unknown> } catch { /* malformed claim — continue */ }
			}
		}
		else if (label === 'c2pa.assertions') {
			assertions = parseAssertions(inner)
		}
		else if (label === 'c2pa.signature') {
			const contentBox = inner.find(b => b.type === 'cbor' || b.type === 'jumc')
			if (contentBox) signatureBytes = contentBox.data
		}
	}

	const { issuer, signingTime } = parseSignatureInfo(signatureBytes)

	const instanceId = (claimData?.['instanceID'] ?? claimData?.['instance_id'] ?? null) as string | null
	const claimGenerator = (claimData?.['claim_generator'] ?? claimData?.['claimGenerator'] ?? null) as string | null
	const label =
		manifestLabel ??
		(claimData?.['dc:title'] as string | undefined) ??
		(claimData?.['title'] as string | undefined) ??
		instanceId ??
		'unknown'

	const activeManifest: C2paManifest = {
		label,
		instanceId,
		claimGenerator,
		signatureInfo: { issuer, certNotBefore: signingTime },
		assertions,
	}

	return { activeManifest }
}
