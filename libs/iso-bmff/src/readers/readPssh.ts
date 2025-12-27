import type { Fields } from '../boxes/types/Fields.ts'
import type { ProtectionSystemSpecificHeaderBox } from '../boxes/types/ProtectionSystemSpecificHeaderBox.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a ProtectionSystemSpecificHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed ProtectionSystemSpecificHeaderBox
 *
 * @public
 */
export function readPssh(view: IsoBoxReadView): Fields<ProtectionSystemSpecificHeaderBox> {
	const { readUint, readArray } = view
	const { version, flags } = view.readFullBox()

	const systemId = readArray(UINT, 1, 16)

	let kidCount: number = 0
	let kid: number[] = []

	if (version > 0) {
		kidCount = readUint(4)
		kid = readArray(UINT, 1, kidCount)
	}

	const dataSize = readUint(4)
	const data = readArray(UINT, 1, dataSize)

	return {
		version,
		flags,
		systemId,
		kidCount,
		kid,
		dataSize,
		data,
	}
};
