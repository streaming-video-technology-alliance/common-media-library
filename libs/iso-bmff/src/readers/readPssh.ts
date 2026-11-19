import type { ProtectionSystemSpecificHeaderBox } from '../boxes/ProtectionSystemSpecificHeaderBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

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
	const view = new IsoBoxReadView(cursor)

	const { readUint, readArray } = view
	const { version, flags } = view.readFullBox()

	const systemId = readArray(UINT, 1, 16)

	let kidCount: number = 0
	let kid: number[] = []

	if (version > 0) {
		kidCount = readUint(4)
		kid = readArray(UINT, 1, kidCount * 16)
	}

	const dataSize = readUint(4)
	const data = readArray(UINT, 1, dataSize)

	return {
		type: 'pssh',
		version,
		flags,
		systemId,
		kidCount,
		kid,
		dataSize,
		data,
	}
}
