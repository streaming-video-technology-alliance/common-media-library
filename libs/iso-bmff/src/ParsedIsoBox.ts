import type { IsoBox } from './IsoBox.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoRawBox } from './IsoRawBox.ts'

/**
 * A box that `readIsoBoxes` returns: a box object of a built-in box type, or a raw box.
 *
 * A test of `box.type` does not exclude a raw box. Use `isIsoBoxType` to narrow a box to a box type.
 *
 * @public
 */
export type ParsedIsoBox<V extends IsoInt64 = number> = IsoBox<V> | IsoRawBox
