import { UINT } from '../fields/UINT.ts';
import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

/**
 * ISO/IEC 23001-7:2011 - 8.1 Protection System Specific Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type ProtectionSystemSpecificHeaderBox = FullBox & {
	systemID: number[];
	dataSize: number;
	data: number[];
};

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
export function pssh(view: IsoView): ProtectionSystemSpecificHeaderBox {
	const { readUint, readArray } = view;
	const { version, flags } = view.readFullBox();

	const systemID = readArray(UINT, 1, 16);
	const dataSize = readUint(4);
	const data = readArray(UINT, 1, dataSize);

	return {
		version,
		flags,
		systemID,
		dataSize,
		data,
	};
};
