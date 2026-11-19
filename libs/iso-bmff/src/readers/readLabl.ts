import type { LabelBox } from '../boxes/LabelBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint16 } from '../cursor/readUint16.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readTerminatedUtf8 } from '../cursor/readTerminatedUtf8.ts'

/**
 * Read the `labl` box (`LabelBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `LabelBox`
 *
 * @public
 */
export function readLabl(cursor: IsoBoxReadCursor<IsoInt64>): LabelBox {
	return {
		type: 'labl',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		labelId: readUint16(cursor),
		language: readTerminatedUtf8(cursor),
		label: readTerminatedUtf8(cursor),
	}
}
