import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { WebVttEmptySampleBox } from '../boxes/WebVttEmptySampleBox.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `vtte` box (`WebVttEmptySampleBox`).
 *
 * The box has no fields, so the function writes only the box header.
 *
 * @param cursor - The write cursor
 * @param _box - The `WebVttEmptySampleBox` fields to write
 *
 * @public
 */
// oxlint-disable-next-line no-unused-vars
export function writeVtte(cursor: IsoBoxWriteCursor, _box: WebVttEmptySampleBox): void {
	endIsoBox(cursor, beginIsoBox(cursor, 'vtte'))
}
