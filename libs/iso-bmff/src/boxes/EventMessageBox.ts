import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Common fields of the EMSG box versions 0 and 1 (ISO/IEC 23009-1:2014 - 5.10.3.3).
 *
 * @public
 */
export type EventMessageBoxBase = FullBox & {
	type: 'emsg'
	/** The URI that identifies the message scheme. The box stores a null-terminated UTF-8 string. */
	schemeIdUri: string
	/** The value of the event. The box stores a null-terminated UTF-8 string. */
	value: string
	timescale: number
	eventDuration: number
	id: number
	messageData: Uint8Array
}

/**
 * A parsed EMSG (Event Message) box, version 0 (ISO/IEC 23009-1:2014 - 5.10.3.3).
 *
 * @public
 */
export type EventMessageBoxV0 = EventMessageBoxBase & {
	version: 0
	presentationTimeDelta: number
}

/**
 * A parsed EMSG (Event Message) box, version 1 (ISO/IEC 23009-1:2014 - 5.10.3.3).
 *
 * Version 1 uses a 64-bit absolute presentation time instead of a delta.
 *
 * @public
 */
export type EventMessageBoxV1<V extends IsoInt64 = number> = EventMessageBoxBase & {
	version: 1
	presentationTime: V
}

/**
 * A parsed EMSG (Event Message) box of a version other than 0 or 1 (ISO/IEC 23009-1:2014 - 5.10.3.3).
 *
 * The syntax defines no fields for such a version except `message_data`.
 * `messageData` holds all bytes after the full box fields.
 *
 * @public
 */
export type EventMessageBoxUnrecognizedVersion = FullBox & {
	type: 'emsg'
	messageData: Uint8Array
}

/**
 * ISO/IEC 23009-1:2014 - 5.10.3.3 Event Message Box
 *
 * The `version` of {@link EventMessageBoxUnrecognizedVersion} is a `number`.
 * A check of `version` alone therefore does not exclude that type.
 * Before the check of `version`, check for a field of {@link EventMessageBoxV0} and {@link EventMessageBoxV1},
 * such as `schemeIdUri`.
 *
 * @public
 */
export type EventMessageBox<V extends IsoInt64 = number> =
	| EventMessageBoxV0
	| EventMessageBoxV1<V>
	| EventMessageBoxUnrecognizedVersion
