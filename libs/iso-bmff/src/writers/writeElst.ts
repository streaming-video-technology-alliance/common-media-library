import type { EditListBox } from '../boxes/EditListBox.ts'
import type { Fields } from '../boxes/Fields.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write an EditListBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.6.6 Edit List Box
 *
 * @param box - The EditListBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeElst(box: Fields<EditListBox>): Uint8Array {
	const v1 = box.version === 1
	const size = v1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entrySize = size + size + 2 + 2 // segmentDuration + mediaTime + mediaRateInteger + mediaRateFraction
	const entriesSize = box.entryCount * entrySize
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'elst', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.entryCount)
	offset += 4

	for (const entry of box.entries) {
		writeUint(dataView, offset, size, entry.segmentDuration)
		offset += size

		// mediaTime is signed
		if (v1) {
			dataView.setBigInt64(offset, BigInt(entry.mediaTime))
		} else {
			dataView.setInt32(offset, entry.mediaTime)
		}
		offset += size

		dataView.setInt16(offset, entry.mediaRateInteger)
		offset += 2

		dataView.setInt16(offset, entry.mediaRateFraction)
		offset += 2
	}

	return new Uint8Array(buffer)
}

