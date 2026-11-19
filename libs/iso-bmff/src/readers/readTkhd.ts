import type { TrackHeaderBox } from '../boxes/TrackHeaderBox.ts'
import { INT } from '../IsoBoxFields.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `tkhd` box (`TrackHeaderBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TrackHeaderBox`
 *
 * @public
 */
export function readTkhd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): TrackHeaderBox<V> {
	const view = new IsoBoxReadView(cursor)

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
