import type { Fields } from '../boxes/types/Fields.ts'
import type { SoundMediaHeaderBox } from '../boxes/types/SoundMediaHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a SoundMediaHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SoundMediaHeaderBox
 *
 * @public
 */
export function readSmhd(view: IsoBoxReadView): Fields<SoundMediaHeaderBox> {
	return {
		...view.readFullBox(),
		balance: view.readUint(2),
		reserved: view.readUint(2),
	}
};
