import { readIsoBoxes } from '@svta/cml-iso-bmff'
import { decodeCoseSign1 } from './cose/decodeCoseSign1.ts'
import { findC2paUuidBox, stripJumbfUuidPrefix } from './utils.ts'
import type { JumbfBox } from './jumbf/JumbfBox.ts'
import { parseJumbfBoxes } from './jumbf/parseJumbfBoxes.ts'
import { parseJumbfLabel } from './jumbf/parseJumbfLabel.ts'

const C2PA_SIGNATURE_LABEL = 'c2pa.signature'
const X5CHAIN_COSE_HEADER = 33

function findSignatureContentBytes(boxes: JumbfBox[]): Uint8Array | null {
	for (const box of boxes) {
		if (box.type !== 'jumb') continue
		const inner = parseJumbfBoxes(box.data)
		const jumd = inner.find(b => b.type === 'jumd')

		if (jumd && parseJumbfLabel(jumd.data) === C2PA_SIGNATURE_LABEL) {
			const content = inner.find(b => b.type === 'cbor' || b.type === 'jumc')
			return content?.data ?? null
		}

		const nested = findSignatureContentBytes(inner)
		if (nested) return nested
	}
	return null
}

/**
 * Extracts the end-entity certificate (DER-encoded) from the C2PA claim signature
 * embedded in a BMFF file.
 *
 * Navigates the JUMBF structure inside the C2PA UUID box to locate the
 * `c2pa.signature` entry, decodes the `COSE_Sign1`, and returns the first
 * certificate from the `x5chain` (COSE protected header label 33).
 *
 * @param mp4Bytes - Raw BMFF bytes (e.g. an MP4 init segment)
 * @returns DER-encoded certificate bytes, or `null` if not found or on any error
 *
 * @example
 * {@includeCode ../test/c2pa/extractManifestCertificate.test.ts#example}
 *
 * @internal
 */
export function extractManifestCertificate(mp4Bytes: Uint8Array): Uint8Array | null {
	try {
		const boxes = readIsoBoxes(mp4Bytes)
		const uuidBox = findC2paUuidBox(boxes)
		if (!uuidBox) return null

		const rawPayload = uuidBox.view.readData(uuidBox.view.bytesRemaining) as Uint8Array
		const jumbfPayload = stripJumbfUuidPrefix(rawPayload)
		if (!jumbfPayload) return null
		const signatureBytes = findSignatureContentBytes(parseJumbfBoxes(jumbfPayload))
		if (!signatureBytes) return null

		const cose = decodeCoseSign1(signatureBytes)
		const x5chain = (cose.protectedHeader[X5CHAIN_COSE_HEADER] ??
			cose.unprotectedHeader[X5CHAIN_COSE_HEADER]) as Uint8Array | Uint8Array[] | null | undefined
		if (!x5chain) return null

		const certDER = Array.isArray(x5chain) ? x5chain[0] : x5chain
		return certDER instanceof Uint8Array ? certDER : null
	} catch {
		return null
	}
}
