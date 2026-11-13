import type { ChunkOffsetBox } from '../boxes/ChunkOffsetBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `ChunkOffsetBox` from an `IsoBoxReadView`.
 *
 * ISO/IEC 14496-12:2012 - 8.7.5 Chunk Offset Box
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `ChunkOffsetBox`
 *
 * @example
 * {@includeCode ../../test/readers/readStco.test.ts#example}
 *
 * @public
 */
export function readStco(view: IsoBoxReadView): ChunkOffsetBox {
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
