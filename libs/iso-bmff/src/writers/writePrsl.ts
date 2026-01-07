import { encodeText } from '@svta/cml-utils'
import type { PreselectionGroupBox } from '../boxes/PreselectionGroupBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeChildBoxes } from '../utils/writeChildBoxes.ts'

/**
 * Write a PreselectionGroupBox to an IsoDataWriter.
 *
 * @param box - The PreselectionGroupBox fields to write
 * @param config - The IsoBoxWriteViewConfig to use
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writePrsl(box: PreselectionGroupBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	const preselectionTagBytes = (box.flags & 0x1000) && box.preselectionTag
		? encodeText(box.preselectionTag)
		: null
	const interleavingTagBytes = (box.flags & 0x4000) && box.interleavingTag
		? encodeText(box.interleavingTag)
		: null

	const headerSize = 8
	const fullBoxSize = 4
	const groupIdSize = 4
	const numEntitiesInGroupSize = 4
	const entitiesSize = box.numEntitiesInGroup * 4
	const preselectionTagSize = preselectionTagBytes ? preselectionTagBytes.length + 1 : 0
	const selectionPrioritySize = (box.flags & 0x2000) ? 1 : 0
	const interleavingTagSize = interleavingTagBytes ? interleavingTagBytes.length + 1 : 0
	const { bytes, size } = writeChildBoxes(box.boxes, config)

	const totalSize = headerSize + fullBoxSize + groupIdSize + numEntitiesInGroupSize +
		entitiesSize + preselectionTagSize + selectionPrioritySize + interleavingTagSize + size

	const writer = new IsoBoxWriteView('prsl', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.groupId, 4)
	writer.writeUint(box.numEntitiesInGroup, 4)

	for (const entity of box.entities) {
		writer.writeUint(entity.entityId, 4)
	}

	if (preselectionTagBytes && box.preselectionTag) {
		writer.writeUtf8TerminatedString(box.preselectionTag)
	}

	if (box.flags & 0x2000) {
		writer.writeUint(box.selectionPriority ?? 0, 1)
	}

	if (interleavingTagBytes && box.interleavingTag) {
		writer.writeUtf8TerminatedString(box.interleavingTag)
	}

	writer.writeBytes(bytes)

	return writer
}
