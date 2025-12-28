import type { Fields } from '../boxes/Fields.ts'
import type { SegmentIndexBox } from '../boxes/SegmentIndexBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a SegmentIndexBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.16.3 Segment Index Box
 *
 * @param box - The SegmentIndexBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeSidx(box: Fields<SegmentIndexBox>): IsoBoxWriteView {
	const v1 = box.version === 1
	const size = v1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const referenceIdSize = 4
	const timescaleSize = 4
	const earliestPresentationTimeSize = size
	const firstOffsetSize = size
	const reservedSize = 2
	const referenceCountSize = 2
	const referencesSize = box.references.length * 12 // 3 x 4 bytes per reference
	const totalSize = headerSize + fullBoxSize + referenceIdSize + timescaleSize +
		earliestPresentationTimeSize + firstOffsetSize + reservedSize + referenceCountSize + referencesSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('sidx', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.referenceId, 4)
	writer.writeUint(box.timescale, 4)
	writer.writeUint(box.earliestPresentationTime, size)
	writer.writeUint(box.firstOffset, size)
	writer.writeUint(box.reserved ?? 0, 2)
	writer.writeUint(box.references.length, 2)

	for (const ref of box.references) {
		// Pack referenceType (1 bit) + referencedSize (31 bits)
		const reference = ((ref.referenceType & 0x1) << 31) | (ref.referencedSize & 0x7FFFFFFF)
		writer.writeUint(reference, 4)

		writer.writeUint(ref.subsegmentDuration, 4)

		// Pack startsWithSap (1 bit) + sapType (3 bits) + sapDeltaTime (28 bits)
		const sap = ((ref.startsWithSap & 0x1) << 31) | ((ref.sapType & 0x7) << 28) | (ref.sapDeltaTime & 0x0FFFFFFF)
		writer.writeUint(sap, 4)
	}

	return writer
}
