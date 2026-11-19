import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { WebVttSourceLabelBox } from '../boxes/WebVttSourceLabelBox.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { writeUtf8 } from '../cursor/writeUtf8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `vlab` box (`WebVttSourceLabelBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `WebVttSourceLabelBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeVlab.test.ts#example}
 *
 * @public
 */
export function writeVlab(cursor: IsoBoxWriteCursor, box: WebVttSourceLabelBox): void {
	const start = beginIsoBox(cursor, 'vlab')

	writeUtf8(cursor, box.sourceLabel)
	endIsoBox(cursor, start)
}
