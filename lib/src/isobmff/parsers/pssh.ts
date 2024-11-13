import type { CursorView } from '../CursorView.js';
import { UINT } from '../fields/UINT.js';
import type { FullBox } from '../FullBox.js';

export type ProtectionSystemSpecificHeaderBox = FullBox & {
	systemID: number[];
	dataSize: number;
	data: number[];
}

//ISO/IEC 23001-7:2011 - 8.1 Protection System Specific Header Box
export function pssh(view: CursorView) {
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
