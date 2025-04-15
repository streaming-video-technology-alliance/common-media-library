import type { IsoView } from '../IsoView.ts';

/**
 * ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type OriginalFormatBox = {
	dataFormat: number;
};

/**
 * Parse an OriginalFormatBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed OriginalFormatBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function frma(view: IsoView): OriginalFormatBox {
	return {
		dataFormat: view.readUint(4),
	};
};
