// The bytes of a box: the size, the type, and then the content.
export function boxBytes(type: string, ...content: Uint8Array[]): Uint8Array<ArrayBuffer> {
	const size = content.reduce((size, bytes) => size + bytes.length, 8)
	const result = new Uint8Array(size)
	let offset = 8

	new DataView(result.buffer).setUint32(0, size)

	for (let i = 0; i < 4; i++) {
		result[4 + i] = type.charCodeAt(i)
	}

	for (const bytes of content) {
		result.set(bytes, offset)
		offset += bytes.length
	}

	return result
}
