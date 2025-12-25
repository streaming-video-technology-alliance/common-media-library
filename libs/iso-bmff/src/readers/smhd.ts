import type { Fields } from '../boxes/Fields.ts'
import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a SoundMediaHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SoundMediaHeaderBox
 *
 *
 * @beta
 */
export function smhd(view: IsoBoxReadView): Fields<SoundMediaHeaderBox> {
	return {
		...view.readFullBox(),
		balance: view.readUint(2),
		reserved: view.readUint(2),
	}
};
