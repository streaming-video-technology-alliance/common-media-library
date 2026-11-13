import type { MovieHeaderBox } from '../boxes/MovieHeaderBox.ts'
import { INT, UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `MovieHeaderBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieHeaderBox`
 *
 * @public
 */
export function readMvhd(view: IsoBoxReadView): MovieHeaderBox {
	const { readUint, readInt, readArray } = view

	const { version, flags } = view.readFullBox()
	const size = version == 1 ? 8 : 4

	return {
		type: 'mvhd',
		version,
		flags,
		creationTime: readUint(size),
		modificationTime: readUint(size),
		timescale: readUint(4),
		duration: readUint(size),
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
