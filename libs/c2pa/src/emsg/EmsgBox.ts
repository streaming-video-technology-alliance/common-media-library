/**
 * A parsed EMSG (Event Message) box, version 0 (ISO 14496-12 §12.6.2).
 *
 * @public
 */
export type EmsgBoxV0 = {
	readonly version: 0
	readonly flags: number
	readonly schemeIdUri: string
	readonly value: string
	readonly timescale: number
	readonly presentationTimeDelta: number
	readonly eventDuration: number
	readonly id: number
	readonly messageData: Uint8Array
}

/**
 * A parsed EMSG (Event Message) box, version 1 (ISO 14496-12 §12.6.2).
 *
 * Version 1 uses a 64-bit absolute presentation time instead of a delta.
 *
 * @public
 */
export type EmsgBoxV1 = {
	readonly version: 1
	readonly flags: number
	readonly schemeIdUri: string
	readonly value: string
	readonly timescale: number
	readonly presentationTime: number
	readonly eventDuration: number
	readonly id: number
	readonly messageData: Uint8Array
}

/**
 * A parsed EMSG (Event Message) box (ISO 14496-12 §12.6.2).
 *
 * Use the `version` discriminant to access version-specific fields
 * ({@link EmsgBoxV0} or {@link EmsgBoxV1}).
 *
 * @public
 */
export type EmsgBox = EmsgBoxV0 | EmsgBoxV1
