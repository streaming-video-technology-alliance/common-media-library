import type { Fields } from '../boxes/Fields.ts';
import type { ProtectionSystemSpecificHeaderBox } from '../boxes/ProtectionSystemSpecificHeaderBox.ts';
import { UINT } from '../fields/UINT.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a ProtectionSystemSpecificHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed ProtectionSystemSpecificHeaderBox
 *
 *
 * @beta
 */
export function pssh(view: IsoView): Fields<ProtectionSystemSpecificHeaderBox> {
	const { readUint, readArray } = view;
	const { version, flags } = view.readFullBox();

	const systemId = readArray(UINT, 1, 16);

	let kidCount: number = 0;
	let kid: number[] = [];

	if (version > 0) {
		kidCount = readUint(4);
		kid = readArray(UINT, 1, kidCount);
	}

	const dataSize = readUint(4);
	const data = readArray(UINT, 1, dataSize);

	return {
		version,
		flags,
		systemId,
		kidCount,
		kid,
		dataSize,
		data,
	};
};
