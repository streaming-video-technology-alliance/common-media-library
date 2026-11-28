import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoInt64Reader } from '../IsoInt64Reader.ts'

/**
 * A read cursor with no `readonly` field, for the functions of the package.
 * `depth` is the number of parent boxes of the box at `pos`.
 *
 * @internal
 */
export type IsoBoxReadCursorState = {
	view: DataView
	start: number
	pos: number
	end: number
	readers?: IsoBoxReadCursor<IsoInt64>['readers']
	int64?: IsoInt64Reader<IsoInt64>
	depth?: number
}
