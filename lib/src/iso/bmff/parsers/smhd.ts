import type { Fields } from '../boxes/Fields.js';
import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a SoundMediaHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SoundMediaHeaderBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function smhd(view: IsoView): Fields<SoundMediaHeaderBox> {
	return {
		...view.readFullBox(),
		balance: view.readUint(2),
		reserved: view.readUint(2),
	};
};
