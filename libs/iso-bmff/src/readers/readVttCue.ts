import type { WebVttCueBox } from '../boxes/WebVttCueBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { readChildBoxes } from '../readChildBoxes.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `vttc` box (`WebVttCueBox`).
 *
 * The `readers` map does not need an entry for the `vttc` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `WebVttCueBox`
 *
 * @public
 */
export function readVttc<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): WebVttCueBox<V> {
	return {
		type: 'vttc',
		boxes: readChildBoxes(cursor),
	}
}
