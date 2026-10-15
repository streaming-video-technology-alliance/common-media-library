import { Encoder } from 'cbor-x/encode'

// Encodes like an interoperable C2PA producer: no tag 64 around byte strings, no record tags, plain maps
const CBOR = new Encoder({ tagUint8Array: false, useRecords: false, mapsAsObjects: false })

/** Encodes `value` as CBOR with plain byte strings and plain maps */
export function encodeCbor(value: unknown): Uint8Array {
	return Uint8Array.from(CBOR.encode(value))
}
