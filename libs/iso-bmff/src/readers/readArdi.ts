import type { AudioRenderingIndicationBox } from '../boxes/AudioRenderingIndicationBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'

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
	return {
		type: 'ardi',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		audioRenderingIndication: readUint8(cursor),
	}
}
