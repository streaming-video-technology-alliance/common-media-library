import type { MovieHeaderBox } from '../boxes/MovieHeaderBox.ts'
import { INT, UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `mvhd` box (`MovieHeaderBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MovieHeaderBox`
 *
 * @public
 */
export function readMvhd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MovieHeaderBox<V> {
	const view = new IsoBoxReadView(cursor)

	const { jump, readUint, readWideUint, readInt, readArray } = view

	const { version, flags } = view.readFullBox()
	const size = version == 1 ? 8 : 4

	return {
		type: 'mvhd',
		version,
		flags,
		creationTime: readWideUint(size),
		modificationTime: readWideUint(size),
		timescale: readUint(4),
		duration: readWideUint(size),
		rate: readInt(4) / 65536,
		volume: readInt(2) / 256,
		// ISO/IEC 14496-12, 6.2.2: u, v, and w are 2.30 values.
		matrix: (jump(10), readArray(INT, 4, 9)).map(
			(value, i) => value / (i % 3 === 2 ? 0x40000000 : 0x10000),
		),
		preDefined: readArray(UINT, 4, 6),
		nextTrackId: readUint(4),
	}
}
