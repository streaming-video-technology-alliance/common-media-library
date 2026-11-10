import type { TrackHeaderBox } from '../boxes/TrackHeaderBox.ts'
import { INT, UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `TrackHeaderBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `TrackHeaderBox`
 *
 * @public
 */
export function readTkhd(view: IsoBoxReadView): TrackHeaderBox {
	const { version, flags } = view.readFullBox()
	const size = version === 1 ? 8 : 4

	return {
		type: 'tkhd',
		version,
		flags,
		creationTime: view.readUint(size),
		modificationTime: view.readUint(size),
		trackId: view.readUint(4),
		reserved1: view.readUint(4),
		duration: view.readUint(size),
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
