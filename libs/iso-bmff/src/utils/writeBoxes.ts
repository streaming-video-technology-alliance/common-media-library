import type { IsoBoxStreamable } from '../IsoBoxStreamable.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeBox } from './writeBox.ts'

/**
 * Write boxes to an array of Uint8Arrays.
 *
 * @param boxes - The boxes to write
 * @param config - The configuration for the writer
 *
 * @returns The written boxes
 *
 * @internal
 */
export function writeBoxes(boxes: Iterable<IsoBoxStreamable>, config: IsoBoxWriteViewConfig): Uint8Array[] {
	return Array.from(boxes, box => writeBox(box, config))
}
