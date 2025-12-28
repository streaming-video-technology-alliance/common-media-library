import type { Fields } from '../boxes/Fields.ts'
import type { SubsampleInformationBox } from '../boxes/SubsampleInformationBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a SubsampleInformationBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.7.7 Sub-Sample Information Box
 *
 * @param box - The SubsampleInformationBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeSubs(box: Fields<SubsampleInformationBox>): IsoBoxWriteView {
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

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('subs', totalSize)
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

	return writer
}
