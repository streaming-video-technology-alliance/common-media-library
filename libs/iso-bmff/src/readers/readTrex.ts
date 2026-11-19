import type { TrackExtendsBox } from '../boxes/TrackExtendsBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `trex` box (`TrackExtendsBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TrackExtendsBox`
 *
 * @public
 */
export function readTrex(cursor: IsoBoxReadCursor<IsoInt64>): TrackExtendsBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'trex',
		...view.readFullBox(),
		trackId: view.readUint(4),
		defaultSampleDescriptionIndex: view.readUint(4),
		defaultSampleDuration: view.readUint(4),
		defaultSampleSize: view.readUint(4),
		defaultSampleFlags: view.readUint(4),
	}
}
