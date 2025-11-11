import { encodeText } from '@svta/cml-utils'
import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
 */
export class HandlerReferenceBox extends FullBox {
	static readonly type = 'hdlr'

	/**
	 * Reads a HandlerReferenceBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
	 */
	static read(view: IsoView): HandlerReferenceBox {
		const { version, flags } = view.readFullBox()
		const preDefined = view.readUint(4)
		const handlerType = view.readString(4)
		const reserved = view.readArray(UINT, 4, 3)
		const name = view.readString(-1)
		return new HandlerReferenceBox(version, flags, preDefined, handlerType, reserved, name)
	}

	/**
	 * Writes a HandlerReferenceBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
	 */
	static write(box: HandlerReferenceBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.preDefined, 4)
		view.writeString(box.handlerType)
		for (const value of box.reserved) {
			view.writeUint(value, 4)
		}
		view.writeTerminatedString(box.name)
	}

	preDefined: number
	handlerType: string
	reserved: number[]
	name: string

	constructor(
		version: number,
		flags: number,
		preDefined: number,
		handlerType: string,
		reserved: number[],
		name: string
	) {
		super('hdlr', version, flags)
		this.preDefined = preDefined
		this.handlerType = handlerType
		this.reserved = reserved
		this.name = name
	}

	override get size(): number {
		const nameBytes = encodeText(this.name)
		const nameSize = nameBytes.length + 1 // null-terminated
		// 8 (box header) + 4 (FullBox) + 4 + 4 + (reserved.length * 4) + nameSize
		return 20 + (this.reserved.length * 4) + nameSize
	}
}
