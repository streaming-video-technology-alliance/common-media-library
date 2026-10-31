import type { IsoBoxMap } from './IsoBoxMap.ts'

/**
 * Check if a box is of a specific type. This is a type guard function.
 *
 * @param type - The type to check for
 * @param box - The box to check
 *
 * @returns `true` if the box is of the specified type, `false` otherwise
 *
 * @public
 */
export function isIsoBoxType<T extends keyof IsoBoxMap>(
	type: T,
	box: unknown,
): box is IsoBoxMap[T] {
	return typeof box === 'object' && box !== null && 'type' in box && box.type === type
}
