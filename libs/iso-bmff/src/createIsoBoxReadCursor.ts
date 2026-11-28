import type { IsoBoxData } from './IsoBoxData.ts'
import type { IsoBoxReadConfig } from './IsoBoxReadConfig.ts'
import type { IsoBoxReadCursor } from './IsoBoxReadCursor.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Creates a read cursor for ISO BMFF data.
 *
 * The cursor keeps the `byteOffset` and the `byteLength` of a view input, so `pos` starts at 0.
 * The cursor shares memory with the input.
 *
 * @param data - The data to read.
 * @param config - The readers map, the `int64` option, and the `spans` option.
 * @returns A cursor at the first byte of the data. With `spans: true`, `readChildBoxes` on the cursor returns boxes with the `start` and `end` fields.
 *
 * @example
 * {@includeCode ../test/createIsoBoxReadCursor.test.ts#example}
 *
 * @public
 */
export function createIsoBoxReadCursor<V extends IsoInt64 = number, S extends boolean = boolean>(
	data: IsoBoxData,
	config?: IsoBoxReadConfig<V, S>,
): IsoBoxReadCursor<V, S>
export function createIsoBoxReadCursor(
	data: IsoBoxData,
	config?: IsoBoxReadConfig,
): IsoBoxReadCursor {
	const view = ArrayBuffer.isView(data)
		? new DataView(data.buffer, data.byteOffset, data.byteLength)
		: new DataView(data)

	return {
		view,
		start: 0,
		pos: 0,
		end: view.byteLength,
		readers: config?.readers,
		int64: config?.int64,
		spans: config?.spans,
	}
}
