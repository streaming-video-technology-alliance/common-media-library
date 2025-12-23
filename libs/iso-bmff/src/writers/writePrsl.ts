import type { Fields } from '../boxes/Fields.ts'
import type { PreselectionGroupBox } from '../boxes/PreselectionGroupBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeFullBox } from './writeFullBox.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write a PreselectionGroupBox to a Uint8Array.
 *
 * @param box - The PreselectionGroupBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writePrsl(box: Fields<PreselectionGroupBox>): Uint8Array {
	const encoder = new TextEncoder()

	const preselectionTagBytes = (box.flags & 0x1000) && box.preselectionTag
		? encoder.encode(box.preselectionTag)
		: null
	const interleavingTagBytes = (box.flags & 0x4000) && box.interleavingTag
		? encoder.encode(box.interleavingTag)
		: null

	const headerSize = 8
	const fullBoxSize = 4
	const groupIdSize = 4
	const numEntitiesInGroupSize = 4
	const entitiesSize = box.numEntitiesInGroup * 4
	const preselectionTagSize = preselectionTagBytes ? preselectionTagBytes.length + 1 : 0
	const selectionPrioritySize = (box.flags & 0x2000) ? 1 : 0
	const interleavingTagSize = interleavingTagBytes ? interleavingTagBytes.length + 1 : 0

	const totalSize = headerSize + fullBoxSize + groupIdSize + numEntitiesInGroupSize +
		entitiesSize + preselectionTagSize + selectionPrioritySize + interleavingTagSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'prsl', totalSize)
	offset += writeFullBox(dataView, offset, box.version, box.flags)

	writeUint(dataView, offset, 4, box.groupId)
	offset += 4

	writeUint(dataView, offset, 4, box.numEntitiesInGroup)
	offset += 4

	for (const entity of box.entities) {
		writeUint(dataView, offset, 4, entity.entityId)
		offset += 4
	}

	if (preselectionTagBytes) {
		result.set(preselectionTagBytes, offset)
		offset += preselectionTagBytes.length
		dataView.setUint8(offset, 0) // null terminator
		offset += 1
	}

	if (box.flags & 0x2000) {
		writeUint(dataView, offset, 1, box.selectionPriority ?? 0)
		offset += 1
	}

	if (interleavingTagBytes) {
		result.set(interleavingTagBytes, offset)
		offset += interleavingTagBytes.length
		dataView.setUint8(offset, 0) // null terminator
	}

	return result
}

