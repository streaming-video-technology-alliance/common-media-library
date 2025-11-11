import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:202x - 8.18.4.1 Preselection group box
 */
export type Entity = {
	entityId: number
}

export class PreselectionGroupBox extends FullBox {
	static readonly type = 'prsl'

	/**
	 * Reads a PreselectionGroupBox from an IsoView
	 *
	 * ISO/IEC 14496-12:202x - 8.18.4.1 Preselection group box
	 */
	static read(view: IsoView): PreselectionGroupBox {
		const { version, flags } = view.readFullBox()
		const groupId = view.readUint(4)
		const numEntitiesInGroup = view.readUint(4)
		const entities = view.readEntries<Entity>(numEntitiesInGroup, () => ({
			entityId: view.readUint(4),
		}))
		const preselectionTag = flags & 0x1000 ? view.readUtf8(-1) : undefined
		const selectionPriority = flags & 0x2000 ? view.readUint(1) : undefined
		const interleavingTag = flags & 0x4000 ? view.readUtf8(-1) : undefined
		return new PreselectionGroupBox(version, flags, groupId, numEntitiesInGroup, entities, preselectionTag, selectionPriority, interleavingTag)
	}

	/**
	 * Writes a PreselectionGroupBox to a DataView
	 *
	 * ISO/IEC 14496-12:202x - 8.18.4.1 Preselection group box
	 */
	static write(box: PreselectionGroupBox, dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box header
		writeUint(dataView, cursor, 4, box.size)
		cursor += 4
		writeString(dataView, cursor, 4, box.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(box, dataView, cursor)
		cursor += 4

		// Write groupId (4 bytes)
		writeUint(dataView, cursor, 4, box.groupId)
		cursor += 4

		// Write numEntitiesInGroup (4 bytes)
		writeUint(dataView, cursor, 4, box.numEntitiesInGroup)
		cursor += 4

		// Write entities
		for (const entity of box.entities) {
			writeUint(dataView, cursor, 4, entity.entityId)
			cursor += 4
		}

		// Write optional fields based on flags
		if (box.flags & 0x1000 && box.preselectionTag) {
			const tagBytes = encodeText(box.preselectionTag)
			const uint8View = new Uint8Array(dataView.buffer)
			uint8View.set(tagBytes, cursor)
			cursor += tagBytes.length
			writeUint(dataView, cursor, 1, 0) // null terminator
			cursor += 1
		}

		if (box.flags & 0x2000 && box.selectionPriority !== undefined) {
			writeUint(dataView, cursor, 1, box.selectionPriority)
			cursor += 1
		}

		if (box.flags & 0x4000 && box.interleavingTag) {
			const tagBytes = encodeText(box.interleavingTag)
			const uint8View = new Uint8Array(dataView.buffer)
			uint8View.set(tagBytes, cursor)
			cursor += tagBytes.length
			writeUint(dataView, cursor, 1, 0) // null terminator
			cursor += 1
		}

		return cursor - bufferOffset
	}

	groupId: number
	numEntitiesInGroup: number
	entities: Entity[]
	preselectionTag?: string
	selectionPriority?: number
	interleavingTag?: string

	constructor(
		version: number,
		flags: number,
		groupId: number,
		numEntitiesInGroup: number,
		entities: Entity[] = [],
		preselectionTag?: string,
		selectionPriority?: number,
		interleavingTag?: string
	) {
		super('prsl', version, flags)
		this.groupId = groupId
		this.numEntitiesInGroup = numEntitiesInGroup
		this.entities = entities
		this.preselectionTag = preselectionTag
		this.selectionPriority = selectionPriority
		this.interleavingTag = interleavingTag
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 + 4 + (entities.length * 4) + optional fields
		let size = 20 + (this.entities.length * 4)

		if (this.preselectionTag) {
			size += encodeText(this.preselectionTag).length + 1
		}

		if (this.selectionPriority !== undefined) {
			size += 1
		}

		if (this.interleavingTag) {
			size += encodeText(this.interleavingTag).length + 1
		}

		return size
	}
}
