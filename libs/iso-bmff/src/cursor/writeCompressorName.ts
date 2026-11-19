import { encodeText } from '@svta/cml-utils'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeBytes } from './writeBytes.ts'
import { writeUint8 } from './writeUint8.ts'

/**
 * Writes the 32 bytes of `compressorname`: a length byte, at most 31 bytes of UTF-8, then 0 to 32 bytes.
 * The function does not cut a character in two.
 *
 * ISO/IEC 14496-12:2015 - 12.1.3.3
 *
 * @internal
 */
export function writeCompressorName(cursor: IsoBoxWriteCursor, name: string): void {
	const bytes = encodeText(name)
	let length = Math.min(bytes.length, 31)

	while (length < bytes.length && (bytes[length] & 0xc0) === 0x80) {
		length--
	}

	writeUint8(cursor, length)
	writeBytes(cursor, bytes.subarray(0, length))
	writeBytes(cursor, new Uint8Array(31 - length))
}
