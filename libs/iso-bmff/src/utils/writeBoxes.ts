import type { IsoBoxStreamable } from '../IsoBoxStreamable.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
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
export function writeBoxes(
	boxes: Iterable<IsoBoxStreamable<IsoInt64>>,
	config: IsoBoxWriteConfig,
): Uint8Array<ArrayBuffer>[] {
	return Array.from(boxes, box => writeBox(box, config))
}
