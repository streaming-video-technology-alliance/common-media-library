import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { writeBytes } from './writeBytes.ts'

/**
 * Copies the bytes of a version 1 write view to a write cursor.
 * A built-in writer that phase 3 of version 2.0.0 did not move yet writes its box with the view, then calls this function.
 *
 * The last pull request of phase 3 deletes the function.
 *
 * @param cursor - The write cursor.
 * @param view - The write view with the complete box.
 *
 * @internal
 */
export function writeLegacyView(cursor: IsoBoxWriteCursor, view: IsoBoxWriteView): void {
	writeBytes(cursor, new Uint8Array(view.buffer, view.byteOffset, view.byteLength))
}
