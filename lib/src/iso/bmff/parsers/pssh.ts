import type { Fields } from '../boxes/Fields.js';
import type { ProtectionSystemSpecificHeaderBox } from '../boxes/ProtectionSystemSpecificHeaderBox.js';
import { UINT } from '../fields/UINT.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a ProtectionSystemSpecificHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed ProtectionSystemSpecificHeaderBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function pssh(view: IsoView): Fields<ProtectionSystemSpecificHeaderBox> {
	const { readUint, readArray } = view;
	const { version, flags } = view.readFullBox();

	const systemId = readArray(UINT, 1, 16);
	const dataSize = readUint(4);
	const data = readArray(UINT, 1, dataSize);

	return {
		version,
		flags,
		systemId,
		dataSize,
		data,
	};
};
