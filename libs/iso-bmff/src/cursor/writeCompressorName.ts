import { encodeText } from '@svta/cml-utils'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { failRange } from './failRange.ts'
import { writeBytes } from './writeBytes.ts'
import { writeUint8 } from './writeUint8.ts'

/**
 * Writes the 32 bytes of `compressorname`: a length byte, the UTF-8 bytes of the name, then zero bytes.
 *
 * ISO/IEC 14496-12:2015 - 12.1.3.3
 *
 * @throws RangeError if `name` is not a string or has more than 31 bytes in UTF-8. The cursor does not move.
 *
 * @internal
 */
export function writeCompressorName(cursor: IsoBoxWriteCursor, name: string): void {
	const bytes = typeof name === 'string' && encodeText(name)

	if (!bytes || bytes.length > 31) {
		failRange('compressorName', 'a string of at most 31 bytes in UTF-8', name)
	}

	writeUint8(cursor, bytes.length)
	writeBytes(cursor, bytes)
	writeBytes(cursor, new Uint8Array(31 - bytes.length))
}
