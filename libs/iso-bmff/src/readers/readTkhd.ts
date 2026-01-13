import type { TrackHeaderBox } from '../boxes/TrackHeaderBox.ts'
import { TEMPLATE, UINT } from '../IsoBoxFields.ts'
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
		layer: view.readUint(2),
		alternateGroup: view.readUint(2),
		volume: view.readTemplate(2),
		reserved3: view.readUint(2),
		matrix: view.readArray(TEMPLATE, 4, 9),
		width: view.readTemplate(4),
		height: view.readTemplate(4),
	}
};
