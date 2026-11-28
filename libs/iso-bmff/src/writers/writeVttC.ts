import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { WebVttConfigurationBox } from '../boxes/WebVttConfigurationBox.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { writeUtf8 } from '../cursor/writeUtf8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `vttC` box (`WebVttConfigurationBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `WebVttConfigurationBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeVttC(cursor: IsoBoxWriteCursor, box: WebVttConfigurationBox): void {
	const start = beginIsoBox(cursor, 'vttC')

	writeUtf8(cursor, box.config)
	endIsoBox(cursor, start)
}
