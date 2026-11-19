import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { TrackExtendsBox } from '../boxes/TrackExtendsBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `trex` box (`TrackExtendsBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.3
 *
 * @param cursor - The write cursor
 * @param box - The `TrackExtendsBox` fields to write
 *
 * @public
 */
export function writeTrex(cursor: IsoBoxWriteCursor, box: TrackExtendsBox): void {
	const headerSize = 8
	const fullBoxSize = 4
	const trackIdSize = 4
	const defaultSampleDescriptionIndexSize = 4
	const defaultSampleDurationSize = 4
	const defaultSampleSizeSize = 4
	const defaultSampleFlagsSize = 4
	const totalSize =
		headerSize +
		fullBoxSize +
		trackIdSize +
		defaultSampleDescriptionIndexSize +
		defaultSampleDurationSize +
		defaultSampleSizeSize +
		defaultSampleFlagsSize

	const writer = new IsoBoxWriteView('trex', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.trackId, 4)
	writer.writeUint(box.defaultSampleDescriptionIndex, 4)
	writer.writeUint(box.defaultSampleDuration, 4)
	writer.writeUint(box.defaultSampleSize, 4)
	writer.writeUint(box.defaultSampleFlags, 4)

	writeLegacyView(cursor, writer)
}
