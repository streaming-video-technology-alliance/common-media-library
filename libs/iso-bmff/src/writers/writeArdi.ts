import type { AudioRenderingIndicationBox } from '../boxes/AudioRenderingIndicationBox.ts'
import type { Fields } from '../boxes/Fields.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write an AudioRenderingIndicationBox to a Uint8Array.
 *
 * @param box - The AudioRenderingIndicationBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeArdi(box: Fields<AudioRenderingIndicationBox>): Uint8Array {
	const headerSize = 8
	const fullBoxSize = 4
	const audioRenderingIndicationSize = 1
	const totalSize = headerSize + fullBoxSize + audioRenderingIndicationSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'ardi', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 1, box.audioRenderingIndication)

	return new Uint8Array(buffer)
}

