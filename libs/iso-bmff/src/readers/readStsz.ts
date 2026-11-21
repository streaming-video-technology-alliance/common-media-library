import type { SampleSizeBox } from '../boxes/SampleSizeBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'

/**
 * Read the `stsz` box (`SampleSizeBox`).
 *
 * When `sampleSize` is not 0, `entrySize` is `undefined`.
 *
 * ISO/IEC 14496-12:2015 - 8.7.3
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SampleSizeBox`
 *
 * @example
 * {@includeCode ../../test/readers/readStsz.test.ts#example}
 *
 * @public
 */
export function readStsz(cursor: IsoBoxReadCursor<IsoInt64>): SampleSizeBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const sampleSize = readUint32(cursor)
	const sampleCount = readUint32(cursor)

	if (sampleSize !== 0) {
		return {
			type: 'stsz',
			version,
			flags,
			sampleSize,
			sampleCount,
			entrySize: undefined,
		}
	}

	const entrySize: number[] = []

	for (let i = 0; i < sampleCount; i++) {
		entrySize.push(readUint32(cursor))
	}

	return {
		type: 'stsz',
		version,
		flags,
		sampleSize,
		sampleCount: undefined,
		entrySize,
	}
}
