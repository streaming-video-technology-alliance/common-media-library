const CBOR_ARRAY_FOUR_ITEMS = 0x84
const CBOR_TEXT_MAJOR_TYPE_BASE = 0x60
const CBOR_BYTES_MAJOR_TYPE_BASE = 0x40
const CBOR_UINT8_LENGTH_INDICATOR = 0x58
const CBOR_UINT16_LENGTH_INDICATOR = 0x59
const CBOR_UINT32_LENGTH_INDICATOR = 0x5a
const CBOR_INLINE_MAX = 23
const CBOR_UINT8_MAX = 255
const CBOR_UINT16_MAX = 65535
const COSE_SIG1_CONTEXT_BYTES = new TextEncoder().encode('Signature1')

function byteStringHeaderSize(length: number): number {
	if (length <= CBOR_INLINE_MAX) return 1
	if (length <= CBOR_UINT8_MAX) return 2
	if (length <= CBOR_UINT16_MAX) return 3
	return 5
}

function writeByteStringHeader(output: Uint8Array, offset: number, length: number): number {
	if (length <= CBOR_INLINE_MAX) {
		output[offset++] = CBOR_BYTES_MAJOR_TYPE_BASE + length
	} else if (length <= CBOR_UINT8_MAX) {
		output[offset++] = CBOR_UINT8_LENGTH_INDICATOR
		output[offset++] = length
	} else if (length <= CBOR_UINT16_MAX) {
		output[offset++] = CBOR_UINT16_LENGTH_INDICATOR
		output[offset++] = (length >> 8) & 0xff
		output[offset++] = length & 0xff
	} else {
		output[offset++] = CBOR_UINT32_LENGTH_INDICATOR
		output[offset++] = (length >>> 24) & 0xff
		output[offset++] = (length >>> 16) & 0xff
		output[offset++] = (length >>> 8) & 0xff
		output[offset++] = length & 0xff
	}
	return offset
}

/**
 * Builds the COSE `Sig_Structure` (ToBeSigned) bytes for a `COSE_Sign1` structure (RFC 9052 §4.4).
 *
 * The resulting bytes are the direct input to signature creation or verification via WebCrypto.
 *
 * @param protectedBytes - Serialized protected header (CBOR-encoded byte string)
 * @param payload - Payload bytes
 * @param externalAad - External additional authenticated data (default: empty)
 * @returns CBOR-encoded `Sig_Structure` array ready for signing or verification
 *
 * @example
 * {@includeCode ../../test/cose/buildSigStructure.test.ts#example}
 *
 * @public
 */
export function buildSigStructure(
	protectedBytes: Uint8Array,
	payload: Uint8Array,
	externalAad: Uint8Array = new Uint8Array(0),
): Uint8Array {
	const totalLength =
		1 // array header
		+ 1 + COSE_SIG1_CONTEXT_BYTES.length // context string (length < 24, fits inline)
		+ byteStringHeaderSize(protectedBytes.length) + protectedBytes.length
		+ byteStringHeaderSize(externalAad.length) + externalAad.length
		+ byteStringHeaderSize(payload.length) + payload.length

	const result = new Uint8Array(totalLength)
	let offset = 0

	result[offset++] = CBOR_ARRAY_FOUR_ITEMS
	result[offset++] = CBOR_TEXT_MAJOR_TYPE_BASE + COSE_SIG1_CONTEXT_BYTES.length
	result.set(COSE_SIG1_CONTEXT_BYTES, offset)
	offset += COSE_SIG1_CONTEXT_BYTES.length

	offset = writeByteStringHeader(result, offset, protectedBytes.length)
	result.set(protectedBytes, offset)
	offset += protectedBytes.length

	offset = writeByteStringHeader(result, offset, externalAad.length)
	result.set(externalAad, offset)
	offset += externalAad.length

	offset = writeByteStringHeader(result, offset, payload.length)
	result.set(payload, offset)

	return result
}
