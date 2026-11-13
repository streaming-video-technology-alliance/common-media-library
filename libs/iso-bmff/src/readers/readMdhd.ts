import type { MediaHeaderBox } from '../boxes/MediaHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `MediaHeaderBox` from an `IsoBoxReadView`.
 *
 * The 64-bit integer fields of the result have the type that the `int64` option of the view returns.
 * With no option, they are numbers.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MediaHeaderBox`
 *
 * @public
 */
export function readMdhd<V extends IsoInt64>(view: IsoBoxReadView<V>): MediaHeaderBox<V> {
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
