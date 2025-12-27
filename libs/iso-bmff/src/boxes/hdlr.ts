import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readHdlr } from '../readers/readHdlr.ts'
import { writeHdlr } from '../writers/writeHdlr.ts'
import type { Fields } from './types/Fields.ts'
import type { HandlerReferenceBox } from './types/HandlerReferenceBox.ts'

/**
 * HandlerReference Box
 *
 * @public
 */
export class hdlr implements Fields<HandlerReferenceBox> {
	/**
	 * Write a HandlerReferenceBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<HandlerReferenceBox>): IsoBoxWriteView {
		return writeHdlr(fields)
	}

	/**
	 * Read a HandlerReferenceBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed HandlerReferenceBox
	 */
	static read(view: IsoBoxReadView): Fields<HandlerReferenceBox> {
		return readHdlr(view)
	}

	version: number
	flags: number
	handlerType: string
	name: string
	preDefined: number
	reserved: any[]

	/**
	 * Create a new HandlerReferenceBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param handlerType - The handlerType
	 * @param name - The name
	 * @param preDefined - The preDefined
	 * @param reserved - The reserved
	 */
	constructor(version: number, flags: number, handlerType: string, name: string, preDefined: number, reserved: any[]) {
		this.version = version
		this.flags = flags
		this.handlerType = handlerType
		this.name = name
		this.preDefined = preDefined
		this.reserved = reserved
	}
}
