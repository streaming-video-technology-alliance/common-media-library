import type { Fields } from '../boxes/Fields.js';
import type { FileTypeBox } from '../boxes/FileTypeBox.js';
import { STRING } from '../fields/STRING.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a FileTypeBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed FileTypeBox
 *
 *
 * @beta
 */
export function ftyp(view: IsoView): Fields<FileTypeBox> {
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
