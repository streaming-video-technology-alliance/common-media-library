import type { KindBox } from '../boxes/KindBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readTerminatedUtf8 } from '../cursor/readTerminatedUtf8.ts'

/**
 * Read the `kind` box (`KindBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `KindBox`
 *
 * @public
 */
export function readKind(cursor: IsoBoxReadCursor<IsoInt64>): KindBox {
	return {
		type: 'kind',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		schemeUri: readTerminatedUtf8(cursor),
		value: readTerminatedUtf8(cursor),
	}
}
