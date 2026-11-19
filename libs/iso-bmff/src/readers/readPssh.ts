import type { ProtectionSystemSpecificHeaderBox } from '../boxes/ProtectionSystemSpecificHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readBytes } from '../cursor/readBytes.ts'

/**
 * Read the `pssh` box (`ProtectionSystemSpecificHeaderBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `ProtectionSystemSpecificHeaderBox`
 *
 * @example
 * {@includeCode ../../test/readers/readPssh.test.ts#example}
 *
 * @public
 */
export function readPssh(cursor: IsoBoxReadCursor<IsoInt64>): ProtectionSystemSpecificHeaderBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const systemId = readBytes(cursor, 16)
	const kid: Uint8Array[] = []

	if (version > 0) {
		const kidCount = readUint32(cursor)

		for (let i = 0; i < kidCount; i++) {
			kid.push(readBytes(cursor, 16))
		}
	}

	return {
		type: 'pssh',
		version,
		flags,
		systemId,
		kid,
		data: readBytes(cursor, readUint32(cursor)),
	}
}
