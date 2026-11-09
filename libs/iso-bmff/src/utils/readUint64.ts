export function readUint64(dataView: DataView, offset: number): bigint {
	return dataView.getBigUint64(offset - dataView.byteOffset)
}
