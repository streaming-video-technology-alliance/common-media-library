import type { SampleDescriptionBox } from '../boxes/SampleDescriptionBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `stsd` box (`SampleDescriptionBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SampleDescriptionBox`
 *
 * @public
 */
export function readStsd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SampleDescriptionBox<V> {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)

	return {
		type: 'stsd',
		version,
		flags,
		entryCount,
		boxes: view.readBoxes<SampleDescriptionBox<V>['boxes'][number]>(entryCount),
	}
}
