import type { IsoBoxWriteCursor } from './IsoBoxWriteCursor.ts'

/**
 * A function that writes one box at the position of a write cursor. `writeIsoBoxes` calls the function for each box of its type.
 *
 * A writer writes the box header with `beginIsoBox` or `beginIsoFullBox`, then the fields, then the size with `endIsoBox`.
 * A writer of a box with child boxes writes them with `writeChildBoxes`, so the writers of `cursor.writers` apply.
 *
 * @public
 */
export type IsoBoxWriter<B> = (cursor: IsoBoxWriteCursor, box: B) => void
