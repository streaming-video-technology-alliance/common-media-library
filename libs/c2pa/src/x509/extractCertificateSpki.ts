import {
	ASN1_TAG_CONTEXT_0,
	ASN1_TAG_INTEGER,
	ASN1_TAG_SEQUENCE,
	readElement,
	readElementRaw,
} from './asn1.ts'

/**
 * Extracts the SubjectPublicKeyInfo (SPKI) DER bytes from an X.509 DER certificate.
 *
 * Navigates the TBSCertificate structure to reach the 7th field
 * (SubjectPublicKeyInfo), skipping version, serialNumber, signatureAlgorithm,
 * issuer, validity, and subject.
 *
 * The returned bytes can be imported directly via
 * `crypto.subtle.importKey('spki', ...)`.
 *
 * @param certDER - DER-encoded X.509 certificate bytes
 * @returns Full DER encoding of the SubjectPublicKeyInfo, or `null` on parse failure
 *
 * @internal
 */
export function extractCertificateSpki(certDER: Uint8Array): Uint8Array | null {
	try {
		const cert = readElement(certDER, 0)
		if (!cert || cert.tag !== ASN1_TAG_SEQUENCE) return null

		const tbs = readElement(cert.value, 0)
		if (!tbs || tbs.tag !== ASN1_TAG_SEQUENCE) return null

		let offset = 0
		let el = readElement(tbs.value, offset)
		if (!el) return null

		// 1. Optional version [0]
		if (el.tag === ASN1_TAG_CONTEXT_0) {
			offset += el.totalSize
			el = readElement(tbs.value, offset)
			if (!el) return null
		}

		// 2. Serial number (INTEGER)
		if (el.tag !== ASN1_TAG_INTEGER) return null
		offset += el.totalSize

		// 3. Signature algorithm (SEQUENCE)
		el = readElement(tbs.value, offset)
		if (!el || el.tag !== ASN1_TAG_SEQUENCE) return null
		offset += el.totalSize

		// 4. Issuer (SEQUENCE)
		el = readElement(tbs.value, offset)
		if (!el || el.tag !== ASN1_TAG_SEQUENCE) return null
		offset += el.totalSize

		// 5. Validity (SEQUENCE)
		el = readElement(tbs.value, offset)
		if (!el || el.tag !== ASN1_TAG_SEQUENCE) return null
		offset += el.totalSize

		// 6. Subject (SEQUENCE)
		el = readElement(tbs.value, offset)
		if (!el || el.tag !== ASN1_TAG_SEQUENCE) return null
		offset += el.totalSize

		// 7. SubjectPublicKeyInfo (SEQUENCE) — return full DER encoding
		return readElementRaw(tbs.value, offset)
	}
	catch {
		return null
	}
}
