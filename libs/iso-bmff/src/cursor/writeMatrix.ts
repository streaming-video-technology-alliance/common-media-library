import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { MovieHeaderBox } from '../boxes/MovieHeaderBox.ts'
import { writeInt32 } from './writeInt32.ts'

/**
 * Writes the 9 values of a transformation matrix. A missing value writes 0.
 *
 * ISO/IEC 14496-12:2015 - 6.2.2: u, v, and w are 2.30 values, and the other values are 16.16 values.
 *
 * @internal
 */
export function writeMatrix(cursor: IsoBoxWriteCursor, matrix: MovieHeaderBox['matrix']): void {
	for (let i = 0; i < 9; i++) {
		writeInt32(cursor, Math.round((matrix[i] ?? 0) * (i % 3 === 2 ? 0x40000000 : 0x10000)))
	}
}
