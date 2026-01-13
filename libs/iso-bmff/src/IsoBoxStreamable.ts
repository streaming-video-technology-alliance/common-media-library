import type { IsoBox } from './IsoBox.ts'
import type { ParsedBox } from './ParsedBox.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'

/**
 * A type that represents a streamable ISO BMFF box or array buffer view.
 *
 * @public
 */
export type IsoBoxStreamable = IsoBox | ParsedIsoBox | ParsedBox<unknown> | ArrayBufferView;
