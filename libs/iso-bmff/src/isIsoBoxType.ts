import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Check if a box is of a specific type. This is a type guard function.
 *
 * A box that `readIsoBoxes` returns narrows to the built-in box type with the 64-bit integer fields of that box.
 * A value of another type narrows to the built-in box type with `number` fields.
 *
 * @param type - The type to check for
 * @param box - The box to check
 *
 * @returns `true` if the box is of the specified type, `false` otherwise
 *
 * @public
 */
export function isIsoBoxType<T extends keyof IsoBoxMap, V extends IsoInt64>(
	type: T,
	box: IsoBox<V> | { view: IsoBoxReadView<V> },
): box is IsoBoxMap<V>[T]

/**
 * Check if a value of an unknown type is a box of a specific type. This is a type guard function.
 *
 * The value narrows to the built-in box type with `number` fields.
 *
 * @param type - The type to check for
 * @param box - The value to check
 *
 * @returns `true` if the value is a box of the specified type, `false` otherwise
 *
 * @public
 */
export function isIsoBoxType<T extends keyof IsoBoxMap>(type: T, box: unknown): box is IsoBoxMap[T]
export function isIsoBoxType(type: string, box: unknown): boolean {
	return typeof box === 'object' && box !== null && 'type' in box && box.type === type
}
