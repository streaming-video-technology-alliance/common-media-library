import type { TrackHeaderBox } from '../boxes/TrackHeaderBox.ts'
import { INT, UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `TrackHeaderBox` from an `IsoBoxReadView`.
 *
 * The 64-bit integer fields of the result have the type that the `int64` option of the view returns.
 * With no option, they are numbers.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `TrackHeaderBox`
 *
 * @public
 */
export function readTkhd<V extends IsoInt64>(view: IsoBoxReadView<V>): TrackHeaderBox<V> {
	const { version, flags } = view.readFullBox()
	const size = version === 1 ? 8 : 4

	return {
		type: 'tkhd',
		version,
		flags,
		creationTime: view.readWideUint(size),
		modificationTime: view.readWideUint(size),
		trackId: view.readUint(4),
		reserved1: view.readUint(4),
		duration: view.readWideUint(size),
		reserved2: view.readArray(UINT, 4, 2),
		layer: view.readInt(2),
		alternateGroup: view.readInt(2),
		volume: view.readInt(2) / 256,
		reserved3: view.readUint(2),
		// ISO/IEC 14496-12, 6.2.2: u, v, and w are 2.30 values.
		matrix: view
			.readArray(INT, 4, 9)
			.map((value, i) => value / (i % 3 === 2 ? 0x40000000 : 0x10000)),
		width: view.readTemplate(4),
		height: view.readTemplate(4),
	}
}
