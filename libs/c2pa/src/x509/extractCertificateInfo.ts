const TEXT_DECODER = new TextDecoder()

import type { CertificateInfo } from './CertificateInfo.ts'
import {
	ASN1_TAG_CONTEXT_0,
	ASN1_TAG_GENERALIZED_TIME,
	ASN1_TAG_INTEGER,
	ASN1_TAG_OBJECT_IDENTIFIER,
	ASN1_TAG_SEQUENCE,
	ASN1_TAG_SET,
	ASN1_TAG_UTC_TIME,
	readElement,
	type Asn1Element,
} from './asn1.ts'

const OID_COMMON_NAME = new Uint8Array([0x55, 0x04, 0x03])
const OID_ORG_NAME = new Uint8Array([0x55, 0x04, 0x0a])

function matchesOID(value: Uint8Array, oid: Uint8Array): boolean {
	if (value.length < oid.length) return false
	for (let i = 0; i < oid.length; i++) {
		if (value[i] !== oid[i]) return false
	}
	return true
}

function parseTime(element: Asn1Element): string | null {
	const text = TEXT_DECODER.decode(element.value)
	if (element.tag === ASN1_TAG_UTC_TIME) {
		const yy = parseInt(text.substring(0, 2), 10)
		const year = yy >= 50 ? 1900 + yy : 2000 + yy
		return `${year}-${text.substring(2, 4)}-${text.substring(4, 6)}T${text.substring(6, 8)}:${text.substring(8, 10)}:${text.substring(10, 12)}Z`
	}
	if (element.tag === ASN1_TAG_GENERALIZED_TIME) {
		return `${text.substring(0, 4)}-${text.substring(4, 6)}-${text.substring(6, 8)}T${text.substring(8, 10)}:${text.substring(10, 12)}:${text.substring(12, 14)}Z`
	}
	return null
}

function findOidValueInSequence(seqValue: Uint8Array, targetOID: Uint8Array): string | null {
	const oidEl = readElement(seqValue, 0)
	if (!oidEl || oidEl.tag !== ASN1_TAG_OBJECT_IDENTIFIER) return null
	if (!matchesOID(oidEl.value, targetOID)) return null

	const valEl = readElement(seqValue, oidEl.totalSize)
	return valEl ? TEXT_DECODER.decode(valEl.value) : null
}

function findRDNValue(issuerValue: Uint8Array, targetOID: Uint8Array): string | null {
	let offset = 0
	while (offset < issuerValue.length) {
		const setEl = readElement(issuerValue, offset)
		if (!setEl || setEl.tag !== ASN1_TAG_SET) break

		let setOffset = 0
		while (setOffset < setEl.value.length) {
			const seqEl = readElement(setEl.value, setOffset)
			if (!seqEl || seqEl.tag !== ASN1_TAG_SEQUENCE) break

			const found = findOidValueInSequence(seqEl.value, targetOID)
			if (found) return found

			setOffset += seqEl.totalSize
		}
		offset += setEl.totalSize
	}
	return null
}

/**
 * Extracts the issuer name and `notBefore` date from a DER-encoded X.509 certificate.
 *
 * Uses a minimal ASN.1 parser that handles the subset of DER structures found in
 * typical C2PA signing certificates. Extracts the issuer Common Name (OID 2.5.4.3)
 * or Organization Name (OID 2.5.4.10) as a fallback, and the `notBefore` validity date.
 *
 * @param certDER - DER-encoded X.509 certificate bytes
 * @returns Certificate information, or `null` if parsing fails
 *
 * @example
 * {@includeCode ../../test/x509/extractCertificateInfo.test.ts#example}
 *
 * @public
 */
export function extractCertificateInfo(certDER: Uint8Array): CertificateInfo | null {
	try {
		const cert = readElement(certDER, 0)
		if (!cert || cert.tag !== ASN1_TAG_SEQUENCE) return null

		const tbs = readElement(cert.value, 0)
		if (!tbs || tbs.tag !== ASN1_TAG_SEQUENCE) return null

		let offset = 0
		let el = readElement(tbs.value, offset)
		if (!el) return null

		// Optional version field (context tag [0])
		if (el.tag === ASN1_TAG_CONTEXT_0) {
			offset += el.totalSize
			el = readElement(tbs.value, offset)
			if (!el) return null
		}

		// Serial number
		if (el.tag !== ASN1_TAG_INTEGER) return null
		offset += el.totalSize

		// Signature algorithm
		el = readElement(tbs.value, offset)
		if (!el || el.tag !== ASN1_TAG_SEQUENCE) return null
		offset += el.totalSize

		// Issuer
		el = readElement(tbs.value, offset)
		if (!el || el.tag !== ASN1_TAG_SEQUENCE) return null
		const issuer =
			findRDNValue(el.value, OID_COMMON_NAME) ??
			findRDNValue(el.value, OID_ORG_NAME) ??
			'Unknown Issuer'
		offset += el.totalSize

		// Validity
		el = readElement(tbs.value, offset)
		let notBefore: string | null = null
		if (el && el.tag === ASN1_TAG_SEQUENCE) {
			const timeEl = readElement(el.value, 0)
			if (timeEl) notBefore = parseTime(timeEl)
		}

		return { issuer, notBefore }
	}
	catch {
		return null
	}
}
