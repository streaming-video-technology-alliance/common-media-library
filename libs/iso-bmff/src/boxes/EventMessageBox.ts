import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Event Message Box (`emsg`).
 *
 * ISO/IEC 23009-1:2022 - 5.10.3.3
 *
 * The syntax defines fields for version 0 and version 1 only.
 * For a version other than 0 or 1, the strings are empty, the numbers are 0, and the box has no time field.
 *
 * @public
 */
export type EventMessageBox<V extends IsoInt64 = number> = FullBox & {
	type: 'emsg'
	/** The URI that identifies the message scheme. The box stores a null-terminated UTF-8 string. */
	schemeIdUri: string
	/** The value of the event. The box stores a null-terminated UTF-8 string. */
	value: string
	timescale: number
	/** The presentation time relative to the earliest presentation time of the segment. Only a box of version 0 has the field. */
	presentationTimeDelta?: number
	/** The 64-bit absolute presentation time. Only a box of version 1 has the field. */
	presentationTime?: V
	eventDuration: number
	id: number
	/** The message bytes. The bytes are a view over the input buffer. */
	messageData: Uint8Array
}
