export function readData(dataView: DataView, offset: number, size: number): Uint8Array {
	const length = (size > 0) ? size : (dataView.byteLength - (offset - dataView.byteOffset));
	return new Uint8Array(dataView.buffer, offset, Math.max(length, 0));
};
