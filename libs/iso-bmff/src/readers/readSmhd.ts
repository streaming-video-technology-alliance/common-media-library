import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `smhd` box (`SoundMediaHeaderBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SoundMediaHeaderBox`
 *
 * @public
 */
export function readSmhd(cursor: IsoBoxReadCursor<IsoInt64>): SoundMediaHeaderBox {
	const view = new IsoBoxReadView(cursor)

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
