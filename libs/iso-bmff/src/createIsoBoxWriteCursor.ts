import type { IsoBoxWriteCursor } from './IsoBoxWriteCursor.ts'
import type { IsoBoxWriterMap } from './IsoBoxWriterMap.ts'

/**
 * Creates a write cursor.
 *
 * @param config - The configuration. `capacity` is the size of the first buffer in bytes. The default is 1024. `writers` is the writers map of `writeChildBoxes`.
 * @returns A cursor at the first byte of an empty buffer.
 *
 * @example
 * {@includeCode ../test/createIsoBoxWriteCursor.test.ts#example}
 *
 * @public
 */
export function createIsoBoxWriteCursor(config?: {
	capacity?: number
	writers?: IsoBoxWriterMap
}): IsoBoxWriteCursor {
	const bytes = new Uint8Array(config?.capacity ?? 1024)

	return { view: new DataView(bytes.buffer), bytes, pos: 0, writers: config?.writers }
}
