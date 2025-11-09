import { encodeText } from '@svta/cml-utils'
import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeTerminatedString } from '../writers/writeTerminatedString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
 */
export class HandlerReferenceBox extends FullBox {
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

	override get size(): number {
		const nameBytes = encodeText(this.name)
		const nameSize = nameBytes.length + 1 // null-terminated
		// 8 (box header) + 4 (FullBox) + 4 + 4 + (reserved.length * 4) + nameSize
		return 20 + (this.reserved.length * 4) + nameSize
	}

	/**
	 * Writes a HandlerReferenceBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
	 */
	write(dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box header
		writeUint(dataView, cursor, 4, this.size)
		cursor += 4
		writeString(dataView, cursor, 4, this.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(this, dataView, cursor)
		cursor += 4

		// Write preDefined (4 bytes)
		writeUint(dataView, cursor, 4, this.preDefined)
		cursor += 4

		// Write handlerType (4 bytes)
		writeString(dataView, cursor, 4, this.handlerType)
		cursor += 4

		// Write reserved
		for (let i = 0; i < this.reserved.length; i++) {
			writeUint(dataView, cursor, 4, this.reserved[i])
			cursor += 4
		}

		// Write name (null-terminated string)
		writeTerminatedString(dataView, cursor, this.name)
		const nameBytes = encodeText(this.name)
		cursor += nameBytes.length + 1

		return cursor - bufferOffset
	}
}

