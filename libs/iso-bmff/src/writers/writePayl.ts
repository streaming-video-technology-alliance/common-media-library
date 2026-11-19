import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { WebVttCuePayloadBox } from '../boxes/WebVttCuePayloadBox.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { writeUtf8 } from '../cursor/writeUtf8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `payl` box (`WebVttCuePayloadBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `WebVttCuePayloadBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writePayl.test.ts#example}
 *
 * @public
 */
export function writePayl(cursor: IsoBoxWriteCursor, box: WebVttCuePayloadBox): void {
	const start = beginIsoBox(cursor, 'payl')

	writeUtf8(cursor, box.cueText)
	endIsoBox(cursor, start)
}
