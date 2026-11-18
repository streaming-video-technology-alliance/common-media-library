import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `smhd` box (`SoundMediaHeaderBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SoundMediaHeaderBox`
 *
 * @public
 */
export function readSmhd(view: IsoBoxReadView<IsoInt64>): SoundMediaHeaderBox {
	const { version, flags } = view.readFullBox()
	const balance = view.readInt(2) / 256

	view.jump(2)

	return {
		type: 'smhd',
		version,
		flags,
		balance,
	}
}
