import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readSsix } from '../readers/readSsix.ts'
import { writeSsix } from '../writers/writeSsix.ts'
import type { Fields } from './types/Fields.ts'
import type { Subsegment } from './types/Subsegment.ts'
import type { SubsegmentIndexBox } from './types/SubsegmentIndexBox.ts'

/**
 * SubsegmentIndex Box
 *
 * @public
 */
export class ssix implements Fields<SubsegmentIndexBox> {
	/**
	 * Write a SubsegmentIndexBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<SubsegmentIndexBox>): IsoBoxWriteView {
		return writeSsix(fields)
	}

	/**
	 * Read a SubsegmentIndexBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed SubsegmentIndexBox
	 */
	static read(view: IsoBoxReadView): Fields<SubsegmentIndexBox> {
		return readSsix(view)
	}

	flags: number
	version: number
	subsegmentCount: number
	subsegments: Subsegment[]

	/**
	 * Create a new SubsegmentIndexBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param subsegmentCount - The subsegmentCount
	 * @param subsegments - The subsegments
	 */
	constructor(version: number, flags: number, subsegmentCount: number, subsegments: Subsegment[]) {
		this.version = version
		this.flags = flags
		this.subsegmentCount = subsegmentCount
		this.subsegments = subsegments
	}
}
