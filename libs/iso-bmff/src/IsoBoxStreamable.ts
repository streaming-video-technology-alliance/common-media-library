import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'

/**
 * A value that the writers take: a box object, a raw box, or the bytes of a box.
 * A box object of a custom type needs a writer in the `writers` map.
 *
 * @public
 */
export type IsoBoxStreamable<V extends IsoInt64 = number> =
	| IsoBox<V>
	| ParsedIsoBox<V>
	| { type: IsoBoxType }
	| ArrayBufferView
