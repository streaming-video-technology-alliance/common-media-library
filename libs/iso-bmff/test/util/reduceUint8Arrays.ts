export function reduceUint8Arrays(bytesArrays: Uint8Array[]): Uint8Array {
	const totalLength = bytesArrays.reduce((acc, arr) => acc + arr.length, 0)
	const reduced = new Uint8Array(totalLength)
	let offset = 0

	for (const bytes of bytesArrays) {
		reduced.set(bytes, offset)
		offset += bytes.length
	}

	return reduced
}
