import type { SchemeTypeBox } from '../boxes/SchemeTypeBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readFourCc } from '../cursor/readFourCc.ts'
import { readTerminatedUtf8 } from '../cursor/readTerminatedUtf8.ts'

/**
 * Read the `schm` box (`SchemeTypeBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SchemeTypeBox`
 *
 * @example
 * {@includeCode ../../test/readers/readSchm.test.ts#example}
 *
 * @public
 */
export function readSchm(cursor: IsoBoxReadCursor<IsoInt64>): SchemeTypeBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)

	return {
		type: 'schm',
		version,
		flags,
		schemeType: readFourCc(cursor),
		schemeVersion: readUint32(cursor),
		schemeUri: flags & 0x000001 ? readTerminatedUtf8(cursor) : undefined,
	}
}
