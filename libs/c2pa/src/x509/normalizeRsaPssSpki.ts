import { readElement, readLength, ASN1_TAG_SEQUENCE } from './asn1.ts'

// OID 1.2.840.113549.1.1.10 (rsassaPss)
const OID_RSASSA_PSS = new Uint8Array([0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0a])

// AlgorithmIdentifier for rsaEncryption (OID 1.2.840.113549.1.1.1) with NULL params
// SEQUENCE { OID rsaEncryption, NULL }
const RSA_ENCRYPTION_ALGORITHM_ID = new Uint8Array([
	0x30, 0x0d, // SEQUENCE, 13 bytes
	0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, // OID rsaEncryption
	0x05, 0x00, // NULL
])

function containsRsaPssOid(bytes: Uint8Array): boolean {
	if (bytes.length < OID_RSASSA_PSS.length) return false
	outer: for (let i = 0; i <= bytes.length - OID_RSASSA_PSS.length; i++) {
		for (let j = 0; j < OID_RSASSA_PSS.length; j++) {
			if (bytes[i + j] !== OID_RSASSA_PSS[j]) continue outer
		}
		return true
	}
	return false
}

/**
 * Normalizes an SPKI that uses the `rsassaPss` OID (1.2.840.113549.1.1.10) to
 * use the generic `rsaEncryption` OID (1.2.840.113549.1.1.1) instead.
 *
 * WebCrypto's `importKey('spki', ...)` with `{ name: 'RSA-PSS' }` expects the
 * SPKI to use the generic `rsaEncryption` OID. Certificates signed with
 * RSASSA-PSS often embed the PSS-specific OID and parameters, which causes
 * `DataError` on import.
 *
 * If the SPKI does not use `rsassaPss`, it is returned unchanged.
 *
 * @internal
 */
export function normalizeRsaPssSpki(spkiBytes: Uint8Array): Uint8Array {
	if (!containsRsaPssOid(spkiBytes)) return spkiBytes

	// Parse outer SEQUENCE
	const outer = readElement(spkiBytes, 0)
	if (!outer || outer.tag !== ASN1_TAG_SEQUENCE) return spkiBytes

	// First child: AlgorithmIdentifier SEQUENCE
	const algId = readElement(outer.value, 0)
	if (!algId || algId.tag !== ASN1_TAG_SEQUENCE) return spkiBytes

	// Second child: BIT STRING with the public key
	const publicKeyBitString = outer.value.subarray(algId.totalSize)

	// Build new SPKI: RSA_ENCRYPTION_ALGORITHM_ID + original BIT STRING
	const innerLength = RSA_ENCRYPTION_ALGORITHM_ID.length + publicKeyBitString.length
	const headerBytes = encodeDerLength(innerLength)
	const result = new Uint8Array(1 + headerBytes.length + innerLength)
	let offset = 0
	result[offset++] = ASN1_TAG_SEQUENCE
	result.set(headerBytes, offset)
	offset += headerBytes.length
	result.set(RSA_ENCRYPTION_ALGORITHM_ID, offset)
	offset += RSA_ENCRYPTION_ALGORITHM_ID.length
	result.set(publicKeyBitString, offset)

	return result
}

function encodeDerLength(length: number): Uint8Array {
	if (length < 0x80) return new Uint8Array([length])
	if (length <= 0xff) return new Uint8Array([0x81, length])
	if (length <= 0xffff) return new Uint8Array([0x82, (length >> 8) & 0xff, length & 0xff])
	return new Uint8Array([0x83, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff])
}
