import type { Fields } from '../boxes/Fields.ts'
import type { SyncSampleBox } from '../boxes/SyncSampleBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a SyncSampleBox to a Uint8Array.
 *
 * ISO/IEC 14496-12:2012 - 8.6.2 Sync Sample Box
 *
 * @param box - The SyncSampleBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeStss(box: Fields<SyncSampleBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entriesSize = box.entryCount * 4
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'stss', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.entryCount)
	offset += 4

	for (const entry of box.entries) {
		writeUint(dataView, offset, 4, entry.sampleNumber)
		offset += 4
	}

	return new Uint8Array(buffer)
}

