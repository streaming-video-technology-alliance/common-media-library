import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readLabl } from '../readers/readLabl.ts'
import { writeLabl } from '../writers/writeLabl.ts'
import type { Fields } from './types/Fields.ts'
import type { LabelBox } from './types/LabelBox.ts'

/**
 * Label Box
 *
 * @public
 */
export class labl implements Fields<LabelBox> {
	/**
	 * Write a LabelBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<LabelBox>): IsoBoxWriteView {
		return writeLabl(fields)
	}

	/**
	 * Read a LabelBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed LabelBox
	 */
	static read(view: IsoBoxReadView): Fields<LabelBox> {
		return readLabl(view)
	}

	version: number
	flags: number
	isGroupLabel: any
	label: string
	labelId: number
	language: string

	/**
	 * Create a new LabelBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param isGroupLabel - The isGroupLabel
	 * @param label - The label
	 * @param labelId - The labelId
	 * @param language - The language
	 */
	constructor(version: number, flags: number, isGroupLabel: any, label: string, labelId: number, language: string) {
		this.version = version
		this.flags = flags
		this.isGroupLabel = isGroupLabel
		this.label = label
		this.labelId = labelId
		this.language = language
	}
}
