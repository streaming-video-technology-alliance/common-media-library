import type { TrackHeaderBox } from '../boxes/TrackHeaderBox.ts'
import { INT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `tkhd` box (`TrackHeaderBox`).
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

	const { jump } = view

	return {
		type: 'tkhd',
		version,
		flags,
		creationTime: view.readWideUint(size),
		modificationTime: view.readWideUint(size),
		trackId: view.readUint(4),
		duration: (jump(4), view.readWideUint(size)),
		layer: (jump(8), view.readInt(2)),
		alternateGroup: view.readInt(2),
		volume: view.readInt(2) / 256,
		// ISO/IEC 14496-12, 6.2.2: u, v, and w are 2.30 values.
		matrix: (jump(2), view.readArray(INT, 4, 9)).map(
			(value, i) => value / (i % 3 === 2 ? 0x40000000 : 0x10000),
		),
		width: view.readTemplate(4),
		height: view.readTemplate(4),
	}
}
