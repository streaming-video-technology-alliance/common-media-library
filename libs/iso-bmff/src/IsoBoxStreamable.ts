import type { IsoBox } from './IsoBox.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { ParsedBox } from './ParsedBox.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'

/**
 * A type that represents a streamable ISO BMFF box or array buffer view.
 *
 * @public
 */
export type IsoBoxStreamable<V extends IsoInt64 = number> =
	| IsoBox<V>
	| ParsedIsoBox<V>
	| ParsedBox<unknown, V>
	| ArrayBufferView
