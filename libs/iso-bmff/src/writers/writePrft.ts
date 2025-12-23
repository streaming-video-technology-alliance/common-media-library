import type { Fields } from '../boxes/Fields.ts'
import type { ProducerReferenceTimeBox } from '../boxes/ProducerReferenceTimeBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a ProducerReferenceTimeBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.16.5 Producer Reference Time Box
 *
 * @param box - The ProducerReferenceTimeBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writePrft(box: Fields<ProducerReferenceTimeBox>): Uint8Array {
	const v1 = box.version === 1
	const mediaTimeSize = v1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const referenceTrackIdSize = 4
	const ntpTimestampSecSize = 4
	const ntpTimestampFracSize = 4
	const totalSize = headerSize + fullBoxSize + referenceTrackIdSize +
		ntpTimestampSecSize + ntpTimestampFracSize + mediaTimeSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'prft', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.referenceTrackId)
	offset += 4

	writeUint(dataView, offset, 4, box.ntpTimestampSec)
	offset += 4

	writeUint(dataView, offset, 4, box.ntpTimestampFrac)
	offset += 4

	writeUint(dataView, offset, mediaTimeSize, box.mediaTime)

	return new Uint8Array(buffer)
}

