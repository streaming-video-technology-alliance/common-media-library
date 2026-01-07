import type { IsoBox } from '../IsoBox.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeBoxes } from './writeBoxes.ts'

/**
 * Write child boxes
 *
 * @param boxes - The boxes to write
 * @param config - The configuration for the writer
 *
 * @returns The byte arrays and total size of the written boxes
 *
 * @internal
 */
export function writeChildBoxes(boxes: IsoBox[], config: IsoBoxWriteViewConfig): { bytes: Uint8Array[], size: number } {
	const bytes = writeBoxes(boxes, config)
	const size = bytes.reduce((size, byte) => size + byte.byteLength, 0)

	return {
		bytes,
		size,
	}
}
