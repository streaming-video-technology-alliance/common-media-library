/**
 * Common fields shared by all EMSG box versions (ISO 14496-12 §12.6.2).
 *
 * @internal
 */
type EmsgBoxBase = {
	readonly flags: number
	readonly schemeIdUri: string
	readonly value: string
	readonly timescale: number
	readonly eventDuration: number
	readonly id: number
	readonly messageData: Uint8Array
}

/**
 * A parsed EMSG (Event Message) box, version 0 (ISO 14496-12 §12.6.2).
 *
 * @internal
 */
export type EmsgBoxV0 = EmsgBoxBase & {
	readonly version: 0
	readonly presentationTimeDelta: number
}

/**
 * A parsed EMSG (Event Message) box, version 1 (ISO 14496-12 §12.6.2).
 *
 * Version 1 uses a 64-bit absolute presentation time instead of a delta.
 *
 * @internal
 */
export type EmsgBoxV1 = EmsgBoxBase & {
	readonly version: 1
	readonly presentationTime: number
}

/**
 * A parsed EMSG (Event Message) box (ISO 14496-12 §12.6.2).
 *
 * Use the `version` discriminant to access version-specific fields
 * ({@link EmsgBoxV0} or {@link EmsgBoxV1}).
 *
 * @internal
 */
export type EmsgBox = EmsgBoxV0 | EmsgBoxV1
