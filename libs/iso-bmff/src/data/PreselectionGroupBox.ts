import { encodeText } from '@svta/cml-utils'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:202x - 8.18.4.1 Preselection group box
 */
export type Entity = {
	entityId: number
}

export class PreselectionGroupBox extends FullBox {
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

