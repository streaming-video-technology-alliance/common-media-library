import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { MovieHeaderBox } from '../boxes/MovieHeaderBox.ts'
import { readInt32 } from './readInt32.ts'

/**
 * Reads the 9 values of a transformation matrix.
 *
 * ISO/IEC 14496-12:2015 - 6.2.2: u, v, and w are 2.30 values, and the other values are 16.16 values.
 *
 * @internal
 */
export function readMatrix(cursor: IsoBoxReadCursor<IsoInt64>): MovieHeaderBox['matrix'] {
	const matrix: number[] = []

	for (let i = 0; i < 9; i++) {
		matrix.push(readInt32(cursor) / (i % 3 === 2 ? 0x40000000 : 0x10000))
	}

	return matrix as MovieHeaderBox['matrix']
}
