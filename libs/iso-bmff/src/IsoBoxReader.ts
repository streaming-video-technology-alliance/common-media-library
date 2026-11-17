import type { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * ISO BMFF box reader
 *
 * The type parameter `V` is the type of the 64-bit integer fields of the view that the reader accepts.
 *
 * @public
 */
export type IsoBoxReader<
	B = unknown,
	T extends IsoBoxType = IsoBoxType,
	V extends IsoInt64 = number,
> = (view: IsoBoxReadView<V>, type: T) => B
