import { TEMPLATE } from '../fields/TEMPLATE.ts';
import { UINT } from '../fields/UINT.ts';
import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

/**
 * ISO/IEC 14496-12:2012 - 8.3.2 Track Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackHeaderBox = FullBox & {
	creationTime: number;
	modificationTime: number;
	trackId: number;
	reserved1: number;
	duration: number;
	reserved2: number[];
	layer: number;
	alternateGroup: number;
	volume: number;
	reserved3: number;
	matrix: number[];
	width: number;
	height: number;
};

/**
 * Parse a TrackHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackHeaderBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function tkhd(view: IsoView): TrackHeaderBox {
	const { version, flags } = view.readFullBox();
	const size = version === 1 ? 8 : 4;

	return {
		version,
		flags,
		creationTime: view.readUint(size),
		modificationTime: view.readUint(size),
		trackId: view.readUint(4),
		reserved1: view.readUint(4),
		duration: view.readUint(size),
		reserved2: view.readArray(UINT, 4, 2),
		layer: view.readUint(2),
		alternateGroup: view.readUint(2),
		volume: view.readTemplate(2),
		reserved3: view.readUint(2),
		matrix: view.readArray(TEMPLATE, 4, 9),
		width: view.readTemplate(4),
		height: view.readTemplate(4),
	};
};
