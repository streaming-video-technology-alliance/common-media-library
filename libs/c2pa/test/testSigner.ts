import { Encoder } from 'cbor-x/encode'
import { buildSigStructure } from '../src/cose/buildSigStructure.ts'

const TEXT_ENCODER = new TextEncoder()

// Plain CBOR as real signers emit it: no tag 64 on byte strings, and Maps encode as plain CBOR maps (no tag 259).
const CBOR = new Encoder({ tagUint8Array: false, useRecords: false, mapsAsObjects: false })

const COSE_SIGN1_TAG = 0xd2
const COSE_HEADER_ALG = 1
const COSE_HEADER_X5CHAIN = 33
const COSE_ALG_ES256 = -7

const DER_INTEGER = 0x02
const DER_BIT_STRING = 0x03
const DER_OBJECT_IDENTIFIER = 0x06
const DER_UTF8_STRING = 0x0c
const DER_UTC_TIME = 0x17
const DER_SEQUENCE = 0x30
const DER_SET = 0x31
const DER_CONTEXT_0 = 0xa0

const OID_ECDSA_WITH_SHA256 = new Uint8Array([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x04, 0x03, 0x02])
const OID_COMMON_NAME = new Uint8Array([0x55, 0x04, 0x03])
const P256_COMPONENT_BYTES = 32

export type TestSigner = {
	/** DER-encoded self-signed end-entity certificate carried in the `x5chain` header. */
	readonly certificateDER: Uint8Array
	/** Common name of the certificate issuer and subject. */
	readonly issuer: string
	/** Signs claim CBOR bytes and returns a `COSE_Sign1_Tagged` structure with a detached payload. */
	sign(claimCborBytes: Uint8Array): Promise<Uint8Array>
}

function concat(...parts: readonly Uint8Array[]): Uint8Array {
	const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0))
	let offset = 0
	for (const part of parts) {
		out.set(part, offset)
		offset += part.length
	}
	return out
}

function derLength(length: number): Uint8Array {
	if (length < 0x80) return new Uint8Array([length])
	if (length < 0x100) return new Uint8Array([0x81, length])
	return new Uint8Array([0x82, length >> 8, length & 0xff])
}

function der(tag: number, ...content: readonly Uint8Array[]): Uint8Array {
	const body = concat(...content)
	return concat(new Uint8Array([tag]), derLength(body.length), body)
}

/** Encodes an unsigned big-endian integer: strip leading zeros, then pad if the high bit is set. */
function derUnsignedInteger(bytes: Uint8Array): Uint8Array {
	let start = 0
	while (start < bytes.length - 1 && bytes[start] === 0) start++
	const magnitude = bytes.subarray(start)
	return der(DER_INTEGER, magnitude[0] & 0x80 ? concat(new Uint8Array([0]), magnitude) : magnitude)
}

function derName(commonName: string): Uint8Array {
	return der(DER_SEQUENCE, der(DER_SET, der(DER_SEQUENCE,
		der(DER_OBJECT_IDENTIFIER, OID_COMMON_NAME),
		der(DER_UTF8_STRING, TEXT_ENCODER.encode(commonName)),
	)))
}

function derUtcTime(time: string): Uint8Array {
	return der(DER_UTC_TIME, TEXT_ENCODER.encode(time))
}

function rawEcdsaToDer(raw: Uint8Array): Uint8Array {
	return der(DER_SEQUENCE,
		derUnsignedInteger(raw.subarray(0, P256_COMPONENT_BYTES)),
		derUnsignedInteger(raw.subarray(P256_COMPONENT_BYTES)),
	)
}

async function signEcdsaSha256(privateKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
	return new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, data as Uint8Array<ArrayBuffer>))
}

/** Builds a minimal self-signed X.509 v3 certificate (RFC 5280 §4.1) over the given SubjectPublicKeyInfo. */
async function buildSelfSignedCertificate(privateKey: CryptoKey, spki: Uint8Array, commonName: string): Promise<Uint8Array> {
	const signatureAlgorithm = der(DER_SEQUENCE, der(DER_OBJECT_IDENTIFIER, OID_ECDSA_WITH_SHA256))
	const tbsCertificate = der(DER_SEQUENCE,
		der(DER_CONTEXT_0, der(DER_INTEGER, new Uint8Array([2]))), // version v3
		der(DER_INTEGER, new Uint8Array([1])), // serialNumber
		signatureAlgorithm,
		derName(commonName), // issuer
		der(DER_SEQUENCE, derUtcTime('250101000000Z'), derUtcTime('351231235959Z')), // validity
		derName(commonName), // subject
		spki,
	)
	const signature = rawEcdsaToDer(await signEcdsaSha256(privateKey, tbsCertificate))
	return der(DER_SEQUENCE, tbsCertificate, signatureAlgorithm, der(DER_BIT_STRING, new Uint8Array([0]), signature))
}

/**
 * Creates a signer with a fresh P-256 key and a self-signed certificate, for tests that need
 * a manifest whose claim signature verifies. Key generation takes a few milliseconds, so create
 * one signer per test file.
 */
export async function createTestSigner(issuer: string = 'CML Test Signer'): Promise<TestSigner> {
	const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
	const spki = new Uint8Array(await crypto.subtle.exportKey('spki', keyPair.publicKey))
	const certificateDER = await buildSelfSignedCertificate(keyPair.privateKey, spki, issuer)
	// cbor-x reuses its output buffer between calls, so copy every encoding.
	const protectedBytes = Uint8Array.from(CBOR.encode(new Map<number, unknown>([
		[COSE_HEADER_ALG, COSE_ALG_ES256],
		[COSE_HEADER_X5CHAIN, [certificateDER]],
	])))

	return {
		certificateDER,
		issuer,
		async sign(claimCborBytes: Uint8Array): Promise<Uint8Array> {
			const signature = await signEcdsaSha256(keyPair.privateKey, buildSigStructure(protectedBytes, claimCborBytes))
			const coseSign1 = Uint8Array.from(CBOR.encode([protectedBytes, new Map(), null, signature]))
			return concat(new Uint8Array([COSE_SIGN1_TAG]), coseSign1)
		},
	}
}
