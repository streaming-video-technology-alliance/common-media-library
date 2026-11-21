import type { TrackEncryptionBox } from '../boxes/TrackEncryptionBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readBytes } from '../cursor/readBytes.ts'

/**
 * Read the `tenc` box (`TrackEncryptionBox`).
 *
 * ISO/IEC 23001-7:2016 - 8.2
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TrackEncryptionBox`
 *
 * @example
 * {@includeCode ../../test/readers/readTenc.test.ts#example}
 *
 * @public
 */
export function readTenc(cursor: IsoBoxReadCursor<IsoInt64>): TrackEncryptionBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)

	cursor.pos += 1

	const pattern = readUint8(cursor)
	const defaultIsProtected = readUint8(cursor)
	const defaultPerSampleIvSize = readUint8(cursor)
	return {
		type: 'tenc',
		version,
		flags,
		defaultPerSampleIvSize,
		defaultKid: readBytes(cursor, 16),
		defaultIsProtected,
		defaultCryptByteBlock: version > 0 ? pattern >> 4 : undefined,
		defaultSkipByteBlock: version > 0 ? pattern & 0xf : undefined,
		defaultConstantIv:
			defaultIsProtected === 1 && defaultPerSampleIvSize === 0 && cursor.pos < cursor.end
				? readBytes(cursor, readUint8(cursor))
				: undefined,
	}
}
