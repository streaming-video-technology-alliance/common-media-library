import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SampleDependencyTypeBox } from '../boxes/SampleDependencyTypeBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeBytes } from '../cursor/writeBytes.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `sdtp` box (`SampleDependencyTypeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.4
 *
 * @param cursor - The write cursor
 * @param box - The `SampleDependencyTypeBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeSdtp(cursor: IsoBoxWriteCursor, box: SampleDependencyTypeBox): void {
	const start = beginIsoFullBox(cursor, 'sdtp', box.version, box.flags)

	writeBytes(cursor, box.sampleDependencyTable)
	endIsoBox(cursor, start)
}
