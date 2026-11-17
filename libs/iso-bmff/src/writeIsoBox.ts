import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoBoxWriteViewConfig } from './IsoBoxWriteViewConfig.ts'
import { createWriterConfig } from './utils/createWriterConfig.ts'
import { writeBox } from './utils/writeBox.ts'

/**
 * Write an ISO box to a Uint8Array.
 *
 * @param box - The box to write
 * @param config - The configuration for the writer
 *
 * @returns The written box. A box given as a view over a `SharedArrayBuffer` is copied, so the result is always backed by an `ArrayBuffer`.
 *
 * @throws Error if a box has no writer, no `boxes` field of a container, and no `view`. The message starts with "No writer found for box type".
 * @throws RangeError if a `bigint` field does not fit its size.
 *
 * @example
 * {@includeCode ../test/writeIsoBox.test.ts#example}
 *
 * @public
 */
export function writeIsoBox(
	box: IsoBoxStreamable<IsoInt64>,
	config?: IsoBoxWriteViewConfig,
): Uint8Array<ArrayBuffer> {
	return writeBox(box, createWriterConfig(config))
}
