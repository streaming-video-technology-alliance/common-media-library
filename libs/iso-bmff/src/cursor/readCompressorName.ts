import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from './readUint8.ts'
import { readUtf8 } from './readUtf8.ts'

/**
 * Reads the 32 bytes of `compressorname`: a length byte, at most 31 bytes of UTF-8, then padding.
 *
 * ISO/IEC 14496-12:2015 - 12.1.3.3
 *
 * @internal
 */
export function readCompressorName(cursor: IsoBoxReadCursor<IsoInt64>): string {
	const length = Math.min(readUint8(cursor), 31)
	const name = readUtf8(cursor, length)

	cursor.pos += 31 - length

	return name
}
