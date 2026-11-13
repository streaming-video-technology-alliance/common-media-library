import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Common fields shared by all EMSG box versions (ISO/IEC 23009-1:2014 - 5.10.3.3).
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
 * ISO/IEC 23009-1:2014 - 5.10.3.3 Event Message Box
 *
 * Use the `version` discriminant to access version-specific fields
 * ({@link EventMessageBoxV0} or {@link EventMessageBoxV1}).
 *
 * @public
 */
export type EventMessageBox<V extends IsoInt64 = number> = EventMessageBoxV0 | EventMessageBoxV1<V>
