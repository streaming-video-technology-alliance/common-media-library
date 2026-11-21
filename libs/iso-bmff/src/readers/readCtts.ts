import type { CompositionOffsetBox } from '../boxes/CompositionOffsetBox.ts'
import type { CompositionOffsetEntry } from '../boxes/CompositionOffsetEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readInt32 } from '../cursor/readInt32.ts'

/**
 * Read the `ctts` box (`CompositionOffsetBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.1.3
 *
 * A box of version 2 or above has no entries in the syntax. The result then has an empty `entries` list.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `CompositionOffsetBox`
 *
 * @public
 */
export function readCtts(cursor: IsoBoxReadCursor<IsoInt64>): CompositionOffsetBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const entryCount = readUint32(cursor)

	if (version > 1) {
		return {
			type: 'ctts',
			version,
			flags,
			entryCount,
			entries: [],
		}
	}

	const readOffset = version === 1 ? readInt32 : readUint32
	const entries: CompositionOffsetEntry[] = []

	for (let i = 0; i < entryCount; i++) {
		entries.push({
			sampleCount: readUint32(cursor),
			sampleOffset: readOffset(cursor),
		})
	}

	return {
		type: 'ctts',
		version,
		flags,
		entryCount: undefined,
		entries,
	}
}
