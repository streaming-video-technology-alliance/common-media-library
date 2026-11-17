import type { SampleDependencyTypeBox } from '../boxes/SampleDependencyTypeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `sdtp` box (`SampleDependencyTypeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.4
 *
 * @param box - The `SampleDependencyTypeBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeSdtp(box: SampleDependencyTypeBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const sampleDependencyTableSize = box.sampleDependencyTable.length
	const totalSize = headerSize + fullBoxSize + sampleDependencyTableSize

	const writer = new IsoBoxWriteView('sdtp', totalSize)
	writer.writeFullBox(box.version, box.flags)

	for (const entry of box.sampleDependencyTable) {
		writer.writeUint(entry, 1)
	}

	return writer
}
