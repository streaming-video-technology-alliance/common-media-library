export function readData(dataView: DataView, offset: number, size: number): Uint8Array {
	const remaining = Math.max(dataView.byteLength - (offset - dataView.byteOffset), 0)
	return new Uint8Array(dataView.buffer, offset, size >= 0 && size < remaining ? size : remaining)
}
