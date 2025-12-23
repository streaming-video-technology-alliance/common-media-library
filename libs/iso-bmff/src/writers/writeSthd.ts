import type { Fields } from '../boxes/Fields.ts'
import type { SubtitleMediaHeaderBox } from '../boxes/SubtitleMediaHeaderBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'

/**
 * Write a SubtitleMediaHeaderBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 12.6.2 Subtitle Media Header Box
 *
 * @param box - The SubtitleMediaHeaderBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeSthd(box: Fields<SubtitleMediaHeaderBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const totalSize = headerSize + fullBoxSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'sthd', totalSize)
	writeFullBox(dataView, offset, box.version, box.flags)

	return new Uint8Array(buffer)
}

