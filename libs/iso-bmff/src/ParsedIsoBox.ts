import type { IsoBox } from './IsoBox.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoRawBox } from './IsoRawBox.ts'

/**
 * A box that `readIsoBoxes` returns: a box object of a box type of `IsoBoxMap`, or a raw box.
 *
 * A test such as `box.type === 'tfdt'` narrows a box to that box type. A raw box has no `type` field, so `!box.type` narrows a box to a raw box.
 * The four-character code of any box is `box.type ?? box.boxType`.
 *
 * @public
 */
export type ParsedIsoBox<V extends IsoInt64 = number> = IsoBox<V> | IsoRawBox
