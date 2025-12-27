import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readPrsl } from '../readers/readPrsl.ts'
import { writePrsl } from '../writers/writePrsl.ts'
import type { Entity } from './types/Entity.ts'
import type { Fields } from './types/Fields.ts'
import type { PreselectionGroupBox } from './types/PreselectionGroupBox.ts'

/**
 * PreselectionGroup Box
 *
 * @public
 */
export class prsl implements Fields<PreselectionGroupBox> {
	/**
	 * Write a PreselectionGroupBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<PreselectionGroupBox>): IsoBoxWriteView {
		return writePrsl(fields)
	}

	/**
	 * Read a PreselectionGroupBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed PreselectionGroupBox
	 */
	static read(view: IsoBoxReadView): Fields<PreselectionGroupBox> {
		return readPrsl(view)
	}

	version: number
	flags: number
	entities: Entity[]
	groupId: number
	numEntitiesInGroup: number
	interleavingTag?: string
	preselectionTag?: string
	selectionPriority?: number

	/**
	 * Create a new PreselectionGroupBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param entities - The entities
	 * @param groupId - The groupId
	 * @param interleavingTag - The interleavingTag
	 * @param numEntitiesInGroup - The numEntitiesInGroup
	 * @param preselectionTag - The preselectionTag
	 * @param selectionPriority - The selectionPriority
	 */
	constructor(version: number, flags: number, entities: Entity[], groupId: number, interleavingTag: string, numEntitiesInGroup: number, preselectionTag: string, selectionPriority: number) {
		this.version = version
		this.flags = flags
		this.entities = entities
		this.groupId = groupId
		this.interleavingTag = interleavingTag
		this.numEntitiesInGroup = numEntitiesInGroup
		this.preselectionTag = preselectionTag
		this.selectionPriority = selectionPriority
	}
}
