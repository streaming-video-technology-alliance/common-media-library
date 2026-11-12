import type { MovieHeaderBox } from '../boxes/MovieHeaderBox.ts'
import { INT, UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `MovieHeaderBox` from an `IsoBoxReadView`.
 *
 * The 64-bit integer fields of the result have the type that the `int64` option of the view returns.
 * With no option, they are numbers.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieHeaderBox`
 *
 * @public
 */
export function readMvhd<V extends IsoInt64>(view: IsoBoxReadView<V>): MovieHeaderBox<V> {
	const { readUint, readWideUint, readInt, readArray } = view

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
		reserved1: readUint(2),
		reserved2: readArray(UINT, 4, 2),
		// ISO/IEC 14496-12, 6.2.2: u, v, and w are 2.30 values.
		matrix: readArray(INT, 4, 9).map((value, i) => value / (i % 3 === 2 ? 0x40000000 : 0x10000)),
		preDefined: readArray(UINT, 4, 6),
		nextTrackId: readUint(4),
	}
}
