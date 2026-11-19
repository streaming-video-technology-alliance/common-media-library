import type { OriginalFormatBox } from '../boxes/OriginalFormatBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readFourCc } from '../cursor/readFourCc.ts'

/**
 * Read the `frma` box (`OriginalFormatBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `OriginalFormatBox`
 *
 * @public
 */
export function readFrma(cursor: IsoBoxReadCursor<IsoInt64>): OriginalFormatBox {
	return {
		type: 'frma',
		dataFormat: readFourCc(cursor),
	}
}
