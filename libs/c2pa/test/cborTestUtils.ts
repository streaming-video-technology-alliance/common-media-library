import { Encoder } from 'cbor-x/encode'

// Encodes like an interoperable C2PA producer: no tag 64 around byte strings, no record tags, plain maps
const CBOR = new Encoder({ tagUint8Array: false, useRecords: false, mapsAsObjects: false })

/** Encodes `value` as CBOR with plain byte strings and plain maps */
export function encodeCbor(value: unknown): Uint8Array {
	return Uint8Array.from(CBOR.encode(value))
}

/** Encodes the map `value` with fewer than 23 entries, then appends one more entry with the key `key` and the value `entry` */
export function encodeCborMapWithEntry(value: Record<string, unknown>, key: unknown, entry: unknown): Uint8Array {
	const map = encodeCbor(value)
	// cbor-x writes the length of an object map in two bytes (0xb9), so the header is replaced
	const info = map[0] & 0x1f
	const headerLength = info < 24 ? 1 : 1 + (1 << (info - 24))
	return Uint8Array.of(
		0xa0 + Object.keys(value).length + 1,
		...map.subarray(headerLength),
		...encodeCbor(key),
		...encodeCbor(entry),
	)
}
