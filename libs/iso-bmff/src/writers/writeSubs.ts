import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { SubSampleInformationBox } from '../boxes/SubSampleInformationBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `subs` box (`SubSampleInformationBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.7
 *
 * @param cursor - The write cursor
 * @param box - The `SubSampleInformationBox` fields to write
 *
 * @public
 */
export function writeSubs(cursor: IsoBoxWriteCursor, box: SubSampleInformationBox): void {
	const v1 = box.version === 1
	const subsampleSizeBytes = v1 ? 4 : 2

	let entriesSize = 0
	for (const entry of box.entries) {
		entriesSize += 4 // sampleDelta
		entriesSize += 2 // subsampleCount
		entriesSize += entry.subsampleCount * (subsampleSizeBytes + 1 + 1 + 4) // size + priority + discardable + codecSpecificParameters
	}

	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const writer = new IsoBoxWriteView('subs', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.entryCount, 4)

	for (const entry of box.entries) {
		writer.writeUint(entry.sampleDelta, 4)
		writer.writeUint(entry.subsampleCount, 2)

		for (const subsample of entry.subsamples) {
			writer.writeUint(subsample.subsampleSize, subsampleSizeBytes)
			writer.writeUint(subsample.subsamplePriority, 1)
			writer.writeUint(subsample.discardable, 1)
			writer.writeUint(subsample.codecSpecificParameters, 4)
		}
	}

	writeLegacyView(cursor, writer)
}
