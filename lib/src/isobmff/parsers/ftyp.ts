import type { IsoView } from '../IsoView.js';
import type { TypeBox } from '../TypeBox.js';
import { STRING } from '../fields/STRING.js';

export type FileTypeBox = TypeBox;

// ISO/IEC 14496-12:2012 - 4.3 File Type Box
export function ftyp(view: IsoView): TypeBox {
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
