import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { WebVttSettingsBox } from '../boxes/WebVttSettingsBox.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { writeUtf8 } from '../cursor/writeUtf8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `sttg` box (`WebVttSettingsBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `WebVttSettingsBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeSttg.test.ts#example}
 *
 * @public
 */
export function writeSttg(cursor: IsoBoxWriteCursor, box: WebVttSettingsBox): void {
	const start = beginIsoBox(cursor, 'sttg')

	writeUtf8(cursor, box.settings)
	endIsoBox(cursor, start)
}
