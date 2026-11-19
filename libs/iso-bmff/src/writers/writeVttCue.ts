import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { WebVttCueBox } from '../boxes/WebVttCueBox.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `vttc` box (`WebVttCueBox`).
 *
 * The `writers` map does not need an entry for the `vttc` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param cursor - The write cursor
 * @param box - The `WebVttCueBox` fields to write
 *
 * @public
 */
export function writeVttc(cursor: IsoBoxWriteCursor, box: WebVttCueBox): void {
	writeContainerBox(cursor, box)
}
