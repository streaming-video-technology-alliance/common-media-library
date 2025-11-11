import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

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
	 * Writes a PreselectionGroupBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:202x - 8.18.4.1 Preselection group box
	 */
	static write(box: PreselectionGroupBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.groupId, 4)
		view.writeUint(box.numEntitiesInGroup, 4)
		for (const entity of box.entities) {
			view.writeUint(entity.entityId, 4)
		}
		if (box.flags & 0x1000 && box.preselectionTag) {
			view.writeUtf8TerminatedString(box.preselectionTag)
		}
		if (box.flags & 0x2000 && box.selectionPriority !== undefined) {
			view.writeUint(box.selectionPriority, 1)
		}
		if (box.flags & 0x4000 && box.interleavingTag) {
			view.writeUtf8TerminatedString(box.interleavingTag)
		}
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
