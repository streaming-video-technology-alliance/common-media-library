import type { SampleToChunkBox } from '../boxes/SampleToChunkBox.ts'
import type { SampleToChunkEntry } from '../boxes/SampleToChunkEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'

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
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const entryCount = readUint32(cursor)
	const entries: SampleToChunkEntry[] = []

	for (let i = 0; i < entryCount; i++) {
		entries.push({
			firstChunk: readUint32(cursor),
			samplesPerChunk: readUint32(cursor),
			sampleDescriptionIndex: readUint32(cursor),
		})
	}

	return {
		type: 'stsc',
		version,
		flags,
		entries,
	}
}
