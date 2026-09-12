const CHUNK_SIZE = 0x8000

/**
 * Encodes binary data to base64
 *
 * @param binary - The binary data to encode
 * @returns The base64 encoded string
 *
 * @public
 *
 * @example
 * {@includeCode ../test/encodeBase64.test.ts#example}
 */
export function encodeBase64(binary: Uint8Array): string {
	let text = ''

	for (let i = 0; i < binary.length; i += CHUNK_SIZE) {
		const chunk: ArrayLike<number> = binary.subarray(i, i + CHUNK_SIZE)
		text += String.fromCharCode.apply(null, chunk as number[])
	}

	return btoa(text)
}
