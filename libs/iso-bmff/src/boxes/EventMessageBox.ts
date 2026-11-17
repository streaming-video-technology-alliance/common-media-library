import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Common fields shared by all emsg box versions (ISO/IEC 23009-1:2022 - 5.10.3.3).
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
	/** The message bytes. The bytes are a view over the input buffer. */
	messageData: Uint8Array
}

/**
 * A parsed emsg (Event Message) box, version 0 (ISO/IEC 23009-1:2022 - 5.10.3.3).
 *
 * @public
 */
export type EventMessageBoxV0 = EventMessageBoxBase & {
	version: 0
	presentationTimeDelta: number
}

/**
 * A parsed emsg (Event Message) box, version 1 (ISO/IEC 23009-1:2022 - 5.10.3.3).
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
 * The values of the `version` field of an emsg box other than 0 or 1. The field has 8 bits, so the values are 2 to 255.
 *
 * @typeParam A - The list of versions that the type builds. Do not set this parameter.
 *
 * @public
 */
export type EventMessageBoxUnrecognizedVersionNumber<A extends number[] = [0, 1]> =
	A['length'] extends 256
		? Exclude<A[number], 0 | 1>
		: EventMessageBoxUnrecognizedVersionNumber<[...A, A['length']]>

/**
 * A parsed emsg (Event Message) box of a version other than 0 or 1 (ISO/IEC 23009-1:2022 - 5.10.3.3).
 *
 * The syntax defines no fields for such a version except `message_data`.
 * `messageData` holds all bytes after the full box fields.
 * The strings are empty and the numbers are 0.
 *
 * @public
 */
export type EventMessageBoxUnrecognizedVersion = EventMessageBoxBase & {
	version: EventMessageBoxUnrecognizedVersionNumber
	presentationTimeDelta: number
	presentationTime: number
}

/**
 * Event Message Box (`emsg`).
 *
 * ISO/IEC 23009-1:2022 - 5.10.3.3
 *
 * Use the `version` discriminant to access version-specific fields
 * ({@link EventMessageBoxV0} or {@link EventMessageBoxV1}).
 *
 * @public
 */
export type EventMessageBox<V extends IsoInt64 = number> =
	| EventMessageBoxV0
	| EventMessageBoxV1<V>
	| EventMessageBoxUnrecognizedVersion
