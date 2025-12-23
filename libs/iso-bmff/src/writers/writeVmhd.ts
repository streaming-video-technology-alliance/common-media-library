import type { Fields } from '../boxes/Fields.ts'
import type { VideoMediaHeaderBox } from '../boxes/VideoMediaHeaderBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a VideoMediaHeaderBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 12.1.2 Video Media Header Box
 *
 * @param box - The VideoMediaHeaderBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeVmhd(box: Fields<VideoMediaHeaderBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const graphicsmodeSize = 2
	const opcolorSize = 6 // 3 x 2 bytes
	const totalSize = headerSize + fullBoxSize + graphicsmodeSize + opcolorSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'vmhd', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 2, box.graphicsmode)
	offset += 2

	for (let i = 0; i < 3; i++) {
		writeUint(dataView, offset, 2, box.opcolor[i] ?? 0)
		offset += 2
	}

	return new Uint8Array(buffer)
}

