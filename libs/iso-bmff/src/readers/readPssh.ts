import type { ProtectionSystemSpecificHeaderBox } from '../boxes/ProtectionSystemSpecificHeaderBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `ProtectionSystemSpecificHeaderBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `ProtectionSystemSpecificHeaderBox`
 *
 * @public
 */
export function readPssh(view: IsoBoxReadView): ProtectionSystemSpecificHeaderBox {
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
		type: 'pssh',
		version,
		flags,
		systemId,
		kidCount,
		kid,
		dataSize,
		data,
	}
};
