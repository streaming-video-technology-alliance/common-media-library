import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoRawBox } from './IsoRawBox.ts'

/**
 * A value that the write functions take: a box object, a raw box, or the bytes of a box.
 *
 * With no type argument, the type is the union of the built-in box types, `IsoRawBox`, and `ArrayBufferView`.
 * Use that form for the type of a variable. A 64-bit integer field takes a `number` or a `bigint`.
 *
 * The write functions pass the type of their argument as `B`.
 * A box with the `type` of a built-in box type must have the fields of that box type, or the `bytes` of a raw box.
 * A box of any other type is a custom box and needs a writer in the `writers` map.
 *
 * @public
 */
export type IsoBoxStreamable<
	B extends { type: IsoBoxType } | ArrayBufferView = IsoBox<IsoInt64> | IsoRawBox | ArrayBufferView,
> = B extends { type: infer T extends keyof IsoBoxMap }
	? B extends IsoRawBox | Omit<IsoBoxMap<IsoInt64>[T], 'type'>
		? B
		: IsoBoxMap<IsoInt64>[T]
	: B
