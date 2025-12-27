import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readTenc } from '../readers/readTenc.ts'
import { writeTenc } from '../writers/writeTenc.ts'
import type { Fields } from './types/Fields.ts'
import type { TrackEncryptionBox } from './types/TrackEncryptionBox.ts'

/**
 * TrackEncryption Box
 *
 * @public
 */
export class tenc implements Fields<TrackEncryptionBox> {
	/**
	 * Write a TrackEncryptionBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<TrackEncryptionBox>): IsoBoxWriteView {
		return writeTenc(fields)
	}

	/**
	 * Read a TrackEncryptionBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed TrackEncryptionBox
	 */
	static read(view: IsoBoxReadView): Fields<TrackEncryptionBox> {
		return readTenc(view)
	}

	version: number
	flags: number
	defaultIsEncrypted: number
	defaultIvSize: number
	defaultKid: any[]

	/**
	 * Create a new TrackEncryptionBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param defaultIsEncrypted - The defaultIsEncrypted
	 * @param defaultIvSize - The defaultIvSize
	 * @param defaultKid - The defaultKid
	 */
	constructor(version: number, flags: number, defaultIsEncrypted: number, defaultIvSize: number, defaultKid: any[]) {
		this.version = version
		this.flags = flags
		this.defaultIsEncrypted = defaultIsEncrypted
		this.defaultIvSize = defaultIvSize
		this.defaultKid = defaultKid
	}
}
