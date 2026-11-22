import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Check if a box is of a specific type. This is a type guard function.
 *
 * The function returns `false` for a raw box, because a raw box has no fields of its box type.
 * A box that `readIsoBoxes` returns narrows to the built-in box type with the 64-bit integer fields of that box.
 * The function checks the type and the absence of `bytes`, not the fields. The result of a custom reader for a built-in type also narrows to the built-in box type.
 * To narrow such a box to the result type of the custom reader, pass that type as the type argument.
 * A value of another type narrows to the built-in box type with `number` fields.
 *
 * @param type - The type to check for
 * @param box - The box to check
 *
 * @returns `true` if the box is of the specified type and is not a raw box, `false` otherwise
 *
 * @example
 * {@includeCode ../test/isIsoBoxType.test.ts#example}
 *
 * @public
 */
export function isIsoBoxType<T extends keyof IsoBoxMap, V extends IsoInt64 = number>(
	type: T,
	box: IsoBox<V> | { type: string } | null | undefined,
): box is IsoBoxMap<V>[T]

/**
 * Check if a value of an unknown type is a box of a specific type. This is a type guard function.
 *
 * The value narrows to the built-in box type with `number` fields.
 *
 * @param type - The type to check for
 * @param box - The value to check
 *
 * @returns `true` if the value is a box of the specified type and is not a raw box, `false` otherwise
 *
 * @public
 */
export function isIsoBoxType<T extends keyof IsoBoxMap>(type: T, box: unknown): box is IsoBoxMap[T]
/**
 * Check if a value is a box of a type that the type argument names, such as the result of a custom reader. This is a type guard function.
 *
 * The value narrows to the type argument. The function checks the type and the absence of `bytes`, not the fields.
 * A call with no type argument is a compile error.
 *
 * @param type - The type to check for
 * @param box - The value to check
 *
 * @returns `true` if the value is a box of the specified type and is not a raw box, `false` otherwise
 *
 * @example
 * {@includeCode ../test/isIsoBoxType.test.ts#typeArgument}
 *
 * @public
 */
export function isIsoBoxType<B extends { type: IsoBoxType } = never>(
	type: B['type'],
	box: unknown,
): box is B
export function isIsoBoxType(type: string, box: unknown): boolean {
	return (
		typeof box === 'object' &&
		box !== null &&
		'type' in box &&
		box.type === type &&
		!('bytes' in box)
	)
}
