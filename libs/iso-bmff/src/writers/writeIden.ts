import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { writeUtf8 } from '../cursor/writeUtf8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `iden` box (`WebVttCueIdBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `WebVttCueIdBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @example
 * {@includeCode ../../test/writers/writeIden.test.ts#example}
 *
 * @public
 */
export function writeIden(cursor: IsoBoxWriteCursor, box: WebVttCueIdBox): void {
	const start = beginIsoBox(cursor, 'iden')

	writeUtf8(cursor, box.cueId)
	endIsoBox(cursor, start)
}
