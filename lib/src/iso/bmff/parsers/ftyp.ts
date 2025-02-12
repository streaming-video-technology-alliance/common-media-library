import type { IsoView } from '../IsoView.js';
import type { TypeBox } from '../TypeBox.js';
import { STRING } from '../fields/STRING.js';

/**
 * ISO/IEC 14496-12:2012 - 4.3 File Type Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type FileTypeBox = TypeBox;

/**
 * Parse a FileTypeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed FileTypeBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function ftyp(view: IsoView): FileTypeBox {
	const size = 4;
	const majorBrand = view.readString(4);
	const minorVersion = view.readUint(4);
	const length = view.bytesRemaining / size;
	const compatibleBrands = view.readArray(STRING, size, length);

	return {
		majorBrand,
		minorVersion,
		compatibleBrands,
	};
}
