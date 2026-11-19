import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { WebVttEmptySampleBox } from '../boxes/WebVttEmptySampleBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

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
	const headerSize = 8
	const totalSize = headerSize

	const writer = new IsoBoxWriteView('vtte', totalSize)
	writeLegacyView(cursor, writer)
}
