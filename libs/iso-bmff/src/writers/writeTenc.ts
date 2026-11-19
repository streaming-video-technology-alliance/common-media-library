import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { TrackEncryptionBox } from '../boxes/TrackEncryptionBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint8 } from '../cursor/writeUint8.ts'
import { writeBytes } from '../cursor/writeBytes.ts'
import { endIsoBox } from '../endIsoBox.ts'
import { writeFixedBytes } from '../cursor/writeFixedBytes.ts'

/**
 * Write the `tenc` box (`TrackEncryptionBox`).
 *
 * ISO/IEC 23001-7:2016 - 8.2
 *
 * @param cursor - The write cursor
 * @param box - The `TrackEncryptionBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeTenc.test.ts#example}
 *
 * @public
 */
export function writeTenc(cursor: IsoBoxWriteCursor, box: TrackEncryptionBox): void {
	const { version, defaultConstantIv } = box

	if (defaultConstantIv && defaultConstantIv.length > 0xff) {
		throw new RangeError(
			`The tenc box has a constant IV of ${defaultConstantIv.length} bytes, and the limit is 255`,
		)
	}

	const start = beginIsoFullBox(cursor, 'tenc', version, box.flags)

	writeUint8(cursor, 0)
	writeUint8(
		cursor,
		version > 0
			? (((box.defaultCryptByteBlock ?? 0) & 0xf) << 4) | ((box.defaultSkipByteBlock ?? 0) & 0xf)
			: 0,
	)
	writeUint8(cursor, box.defaultIsProtected)
	writeUint8(cursor, box.defaultPerSampleIvSize)
	writeFixedBytes(cursor, box.defaultKid, 16)

	if (defaultConstantIv) {
		writeUint8(cursor, defaultConstantIv.length)
		writeBytes(cursor, defaultConstantIv)
	}

	endIsoBox(cursor, start)
}
