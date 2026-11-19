import type { SampleToChunkBox } from '../boxes/SampleToChunkBox.ts'
import type { SampleToChunkEntry } from '../boxes/SampleToChunkEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `stsc` box (`SampleToChunkBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.4
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SampleToChunkBox`
 *
 * @example
 * {@includeCode ../../test/readers/readStsc.test.ts#example}
 *
 * @public
 */
export function readStsc(cursor: IsoBoxReadCursor<IsoInt64>): SampleToChunkBox {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)

	return {
		type: 'stsc',
		version,
		flags,
		entryCount,
		entries: view.readEntries<SampleToChunkEntry>(entryCount, () => ({
			firstChunk: view.readUint(4),
			samplesPerChunk: view.readUint(4),
			sampleDescriptionIndex: view.readUint(4),
		})),
	}
}
