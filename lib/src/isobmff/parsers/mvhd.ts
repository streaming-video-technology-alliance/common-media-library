import type { CursorView } from '../CursorView.js';
import { UINT } from '../fields/UINT.js';

export type MovieHeaderBox = {
	version: number;
	flags: number;
	creationTime: number;
	modificationTime: number;
	timescale: number;
	duration: number;
	rate: number;
	volume: number;
	reserved1: number;
	reserved2: number[];
	matrix: number[];
	preDefined: number[];
	nextTrackId: number;
};

// ISO/IEC 14496-12:2012 - 8.2.2 Movie Header Box
export function mvhd(view: CursorView): MovieHeaderBox {
	const { readUint, readTemplate, readArray } = view;

	const { version, flags } = view.readFullBox();
	const size = (version == 1) ? 8 : 4;

	return {
		version,
		flags,
		creationTime: readUint(size),
		modificationTime: readUint(size),
		timescale: readUint(4),
		duration: readUint(size),
		rate: readTemplate(4),
		volume: readTemplate(2),
		reserved1: readUint(2),
		reserved2: readArray(UINT, 4, 2),
		matrix: readArray(UINT, 4, 9),
		preDefined: readArray(UINT, 4, 6),
		nextTrackId: readUint(4),
	};
};
