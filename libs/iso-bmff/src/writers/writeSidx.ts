import type { Fields } from '../boxes/Fields.ts'
import type { SegmentIndexBox } from '../boxes/SegmentIndexBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a SegmentIndexBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.16.3 Segment Index Box
 *
 * @param box - The SegmentIndexBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeSidx(box: Fields<SegmentIndexBox>): Uint8Array {
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

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'sidx', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.referenceId)
	offset += 4

	writeUint(dataView, offset, 4, box.timescale)
	offset += 4

	writeUint(dataView, offset, size, box.earliestPresentationTime)
	offset += size

	writeUint(dataView, offset, size, box.firstOffset)
	offset += size

	writeUint(dataView, offset, 2, box.reserved ?? 0)
	offset += 2

	writeUint(dataView, offset, 2, box.references.length)
	offset += 2

	for (const ref of box.references) {
		// Pack referenceType (1 bit) + referencedSize (31 bits)
		const reference = ((ref.referenceType & 0x1) << 31) | (ref.referencedSize & 0x7FFFFFFF)
		writeUint(dataView, offset, 4, reference)
		offset += 4

		writeUint(dataView, offset, 4, ref.subsegmentDuration)
		offset += 4

		// Pack startsWithSap (1 bit) + sapType (3 bits) + sapDeltaTime (28 bits)
		const sap = ((ref.startsWithSap & 0x1) << 31) | ((ref.sapType & 0x7) << 28) | (ref.sapDeltaTime & 0x0FFFFFFF)
		writeUint(dataView, offset, 4, sap)
		offset += 4
	}

	return new Uint8Array(buffer)
}

