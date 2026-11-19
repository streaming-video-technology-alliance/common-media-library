import type { ChunkOffsetBox } from '../boxes/ChunkOffsetBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `stco` box (`ChunkOffsetBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.5
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `ChunkOffsetBox`
 *
 * @example
 * {@includeCode ../../test/readers/readStco.test.ts#example}
 *
 * @public
 */
export function readStco(cursor: IsoBoxReadCursor<IsoInt64>): ChunkOffsetBox {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)

	return {
		type: 'stco',
		version,
		flags,
		entryCount,
		chunkOffset: view.readArray(UINT, 4, entryCount),
	}
}
