import type { IsoView } from '../IsoView.ts';
import { UINT } from '../fields/UINT.ts';

/**
 * ISO/IEC 14496-12:2012 - 8.2.2 Movie Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
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

/**
 * Parse a Box from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function mvhd(view: IsoView): MovieHeaderBox {
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
