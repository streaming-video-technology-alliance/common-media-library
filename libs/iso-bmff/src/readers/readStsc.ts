import type { SampleToChunkBox } from '../boxes/SampleToChunkBox.ts'
import type { SampleToChunkEntry } from '../boxes/SampleToChunkEntry.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `stsc` box (`SampleToChunkBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.4
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SampleToChunkBox`
 *
 * @example
 * {@includeCode ../../test/readers/readStsc.test.ts#example}
 *
 * @public
 */
export function readStsc(view: IsoBoxReadView<IsoInt64>): SampleToChunkBox {
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
