import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `SoundMediaHeaderBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SoundMediaHeaderBox`
 *
 * @public
 */
export function readSmhd(view: IsoBoxReadView): SoundMediaHeaderBox {
	return {
		type: 'smhd',
		...view.readFullBox(),
		balance: view.readInt(2) / 256,
		reserved: view.readUint(2),
	}
}
