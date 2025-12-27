import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readSidx } from '../readers/readSidx.ts'
import { writeSidx } from '../writers/writeSidx.ts'
import type { Fields } from './types/Fields.ts'
import type { SegmentIndexBox } from './types/SegmentIndexBox.ts'

/**
 * SegmentIndex Box
 *
 * @public
 */
export class sidx implements Fields<SegmentIndexBox> {
	/**
	 * Write a SegmentIndexBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<SegmentIndexBox>): IsoBoxWriteView {
		return writeSidx(fields)
	}

	/**
	 * Read a SegmentIndexBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed SegmentIndexBox
	 */
	static read(view: IsoBoxReadView): Fields<SegmentIndexBox> {
		return readSidx(view)
	}

	flags: number
	version: number
	earliestPresentationTime: number
	firstOffset: number
	referenceId: number
	references: any[]
	reserved: number
	timescale: number

	/**
	 * Create a new SegmentIndexBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param earliestPresentationTime - The earliestPresentationTime
	 * @param firstOffset - The firstOffset
	 * @param referenceId - The referenceId
	 * @param references - The references
	 * @param reserved - The reserved
	 * @param timescale - The timescale
	 */
	constructor(version: number, flags: number, earliestPresentationTime: number, firstOffset: number, referenceId: number, references: any[], reserved: number, timescale: number) {
		this.version = version
		this.flags = flags
		this.earliestPresentationTime = earliestPresentationTime
		this.firstOffset = firstOffset
		this.referenceId = referenceId
		this.references = references
		this.reserved = reserved
		this.timescale = timescale
	}
}
