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
 * @returns The written box
 *
 * @public
 */
export function writeIsoBox(box: IsoBoxStreamable, config?: IsoBoxWriteViewConfig): Uint8Array {
	return writeBox(box, createWriterConfig(config))
}
