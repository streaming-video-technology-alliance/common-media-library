import type { MediaHeaderBox } from '../boxes/MediaHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `mdhd` box (`MediaHeaderBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MediaHeaderBox`
 *
 * @public
 */
export function readMdhd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MediaHeaderBox<V> {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()

	const creationTime = view.readWideUint(version == 1 ? 8 : 4)
	const modificationTime = view.readWideUint(version == 1 ? 8 : 4)
	const timescale = view.readUint(4)
	const duration = view.readWideUint(version == 1 ? 8 : 4)
	const lang = view.readUint(2)
	const language = String.fromCharCode(
		((lang >> 10) & 0x1f) + 0x60,
		((lang >> 5) & 0x1f) + 0x60,
		(lang & 0x1f) + 0x60,
	)

	const preDefined = view.readUint(2)

	return {
		type: 'mdhd',
		version,
		flags,
		creationTime,
		modificationTime,
		timescale,
		duration,
		language,
		preDefined,
	}
}
