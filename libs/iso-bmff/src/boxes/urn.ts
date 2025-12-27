import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readUrn } from '../readers/readUrn.ts'
import { writeUrn } from '../writers/writeUrn.ts'
import type { Fields } from './types/Fields.ts'
import type { UrnBox } from './types/UrnBox.ts'

/**
 * Urn Box
 *
 * @public
 */
export class urn implements Fields<UrnBox> {
	/**
	 * Write a UrnBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<UrnBox>): IsoBoxWriteView {
		return writeUrn(fields)
	}

	/**
	 * Read a UrnBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed UrnBox
	 */
	static read(view: IsoBoxReadView): Fields<UrnBox> {
		return readUrn(view)
	}

	version: number
	flags: number
	location: string
	name: string

	/**
	 * Create a new UrnBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param location - The location
	 * @param name - The name
	 */
	constructor(version: number, flags: number, location: string, name: string) {
		this.version = version
		this.flags = flags
		this.location = location
		this.name = name
	}
}
