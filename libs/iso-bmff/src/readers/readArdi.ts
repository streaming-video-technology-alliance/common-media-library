import type { AudioRenderingIndicationBox } from '../boxes/AudioRenderingIndicationBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `ardi` box (`AudioRenderingIndicationBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `AudioRenderingIndicationBox`
 *
 * @public
 */
export function readArdi(cursor: IsoBoxReadCursor<IsoInt64>): AudioRenderingIndicationBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'ardi',
		...view.readFullBox(),
		audioRenderingIndication: view.readUint(1),
	}
}
