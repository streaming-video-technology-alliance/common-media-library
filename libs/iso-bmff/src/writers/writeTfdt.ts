import type { Fields } from '../boxes/Fields.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from '../boxes/TrackFragmentBaseMediaDecodeTimeBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a TrackFragmentBaseMediaDecodeTimeBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Base Media Decode Time Box
 *
 * @param box - The TrackFragmentBaseMediaDecodeTimeBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeTfdt(box: Fields<TrackFragmentBaseMediaDecodeTimeBox>): Uint8Array {
	const size = box.version === 1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const baseMediaDecodeTimeSize = size
	const totalSize = headerSize + fullBoxSize + baseMediaDecodeTimeSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'tfdt', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, size, box.baseMediaDecodeTime)

	return new Uint8Array(buffer)
}

