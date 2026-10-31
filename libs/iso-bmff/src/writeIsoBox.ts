import type { IsoBoxStreamable } from './IsoBoxStreamable.ts'
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
 * @public
 */
export function writeIsoBox(
	box: IsoBoxStreamable,
	config?: IsoBoxWriteViewConfig,
): Uint8Array<ArrayBuffer> {
	return writeBox(box, createWriterConfig(config))
}
