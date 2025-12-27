import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readEmsg } from '../readers/readEmsg.ts'
import { writeEmsg } from '../writers/writeEmsg.ts'
import type { EventMessageBox } from './types/EventMessageBox.ts'
import type { Fields } from './types/Fields.ts'

/**
 * EventMessage Box
 *
 * @public
 */
export class emsg implements Fields<EventMessageBox> {
	/**
	 * Write a EventMessageBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<EventMessageBox>): IsoBoxWriteView {
		return writeEmsg(fields)
	}

	/**
	 * Read a EventMessageBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed EventMessageBox
	 */
	static read(view: IsoBoxReadView): Fields<EventMessageBox> {
		return readEmsg(view)
	}

	version: number
	flags: number
	schemeIdUri: string
	value: string
	timescale: number
	presentationTime: number
	presentationTimeDelta: number
	eventDuration: number
	id: number
	messageData: Uint8Array

	/**
	 * Create a new EventMessageBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param schemeIdUri - The schemeIdUri
	 * @param value - The value
	 * @param timescale - The timescale
	 * @param presentationTime - The presentationTime
	 * @param presentationTimeDelta - The presentationTimeDelta
	 * @param eventDuration - The eventDuration
	 * @param id - The id
	 * @param messageData - The messageData
	 */
	constructor(version: number, flags: number, schemeIdUri: string, value: string, timescale: number, presentationTime: number, presentationTimeDelta: number, eventDuration: number, id: number, messageData: Uint8Array) {
		this.version = version
		this.flags = flags
		this.schemeIdUri = schemeIdUri
		this.value = value
		this.timescale = timescale
		this.presentationTime = presentationTime
		this.presentationTimeDelta = presentationTimeDelta
		this.eventDuration = eventDuration
		this.id = id
		this.messageData = messageData
	}
}
