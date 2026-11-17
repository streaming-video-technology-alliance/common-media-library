import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `SoundMediaHeaderBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SoundMediaHeaderBox`
 *
 * @public
 */
export function readSmhd(view: IsoBoxReadView<IsoInt64>): SoundMediaHeaderBox {
	return {
		type: 'smhd',
		...view.readFullBox(),
		balance: view.readInt(2) / 256,
		reserved: view.readUint(2),
	}
}
