import type { Fields } from '../boxes/Fields.ts'
import type { SampleDependencyTypeBox } from '../boxes/SampleDependencyTypeBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a SampleDependencyTypeBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.6.4 Independent and Disposable Samples Box
 *
 * @param box - The SampleDependencyTypeBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeSdtp(box: Fields<SampleDependencyTypeBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const sampleDependencyTableSize = box.sampleDependencyTable.length
	const totalSize = headerSize + fullBoxSize + sampleDependencyTableSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'sdtp', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	for (const entry of box.sampleDependencyTable) {
		writeUint(dataView, offset, 1, entry)
		offset += 1
	}

	return new Uint8Array(buffer)
}

