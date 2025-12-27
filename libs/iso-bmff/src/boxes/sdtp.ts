import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readSdtp } from '../readers/readSdtp.ts'
import { writeSdtp } from '../writers/writeSdtp.ts'
import type { Fields } from './types/Fields.ts'
import type { SampleDependencyTypeBox } from './types/SampleDependencyTypeBox.ts'

/**
 * SampleDependencyType Box
 *
 * @public
 */
export class sdtp implements Fields<SampleDependencyTypeBox> {
	/**
	 * Write a SampleDependencyTypeBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<SampleDependencyTypeBox>): IsoBoxWriteView {
		return writeSdtp(fields)
	}

	/**
	 * Read a SampleDependencyTypeBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed SampleDependencyTypeBox
	 */
	static read(view: IsoBoxReadView): Fields<SampleDependencyTypeBox> {
		return readSdtp(view)
	}

	flags: number
	sampleDependencyTable: number[]
	version: number

	/**
	 * Create a new SampleDependencyTypeBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param sampleDependencyTable - The sampleDependencyTable
	 */
	constructor(version: number, flags: number, sampleDependencyTable: number[]) {
		this.version = version
		this.flags = flags
		this.sampleDependencyTable = sampleDependencyTable
	}
}
