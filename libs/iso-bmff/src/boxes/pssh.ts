import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readPssh } from '../readers/readPssh.ts'
import { writePssh } from '../writers/writePssh.ts'
import type { Fields } from './types/Fields.ts'
import type { ProtectionSystemSpecificHeaderBox } from './types/ProtectionSystemSpecificHeaderBox.ts'

/**
 * ProtectionSystemSpecificHeader Box
 *
 * @public
 */
export class pssh implements Fields<ProtectionSystemSpecificHeaderBox> {
	/**
	 * Write a ProtectionSystemSpecificHeaderBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<ProtectionSystemSpecificHeaderBox>): IsoBoxWriteView {
		return writePssh(fields)
	}

	/**
	 * Read a ProtectionSystemSpecificHeaderBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed ProtectionSystemSpecificHeaderBox
	 */
	static read(view: IsoBoxReadView): Fields<ProtectionSystemSpecificHeaderBox> {
		return readPssh(view)
	}

	flags: number
	version: number
	data: number[]
	dataSize: number
	kid: number[]
	kidCount: number
	systemId: number[]

	/**
	 * Create a new ProtectionSystemSpecificHeaderBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param data - The data
	 * @param dataSize - The dataSize
	 * @param kid - The kid
	 * @param kidCount - The kidCount
	 * @param systemId - The systemId
	 */
	constructor(version: number, flags: number, data: number[], dataSize: number, kid: number[], kidCount: number, systemId: number[]) {
		this.version = version
		this.flags = flags
		this.data = data
		this.dataSize = dataSize
		this.kid = kid
		this.kidCount = kidCount
		this.systemId = systemId
	}
}
