import type { Fields } from '../boxes/Fields.ts'
import type { SampleDependencyTypeBox } from '../boxes/SampleDependencyTypeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a SampleDependencyTypeBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.6.4 Independent and Disposable Samples Box
 *
 * @param box - The SampleDependencyTypeBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeSdtp(box: Fields<SampleDependencyTypeBox>): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const sampleDependencyTableSize = box.sampleDependencyTable.length
	const totalSize = headerSize + fullBoxSize + sampleDependencyTableSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('sdtp', totalSize)
	writer.writeFullBox(box.version, box.flags)

	for (const entry of box.sampleDependencyTable) {
		writer.writeUint(entry, 1)
	}

	return writer
}
