import type { Box } from './boxes/Box.ts'
import type { IsoBox } from './IsoBox.ts'
import type { ParsedBox } from './ParsedBox.ts'

/**
 * Return type for the ISO box reader.
 *
 * Creates a discriminated union of all box types returned by the readers,
 * plus ParsedBox for unknown/container boxes. This enables type narrowing
 * via `box.type === 'xxxx'`.
 *
 * The union does not include a built-in box type whose reader `T` replaces.
 * A custom reader therefore narrows to its own return type only. The replaced
 * box types are:
 *
 * - Every key whose value is a required reader. An optional reader may be
 *   absent. The union then keeps the built-in type of that box and adds the
 *   return type of the reader.
 * - A `url` or `urn` key also replaces `'url '` or `'urn '`. The view finds a
 *   reader by the trimmed type as well.
 * - When a key is not a literal, such as `string` from a computed key, every
 *   built-in box type stays.
 *
 * @public
 */
export type IsoBoxReaderReturn<T> =
	| NonNullable<
			{
				[K in keyof T]: NonNullable<T[K]> extends (...args: never[]) => infer B
					? ParsedBox<B>
					: never
			}[keyof T]
	  >
	| (NonNullable<
			{
				[K in keyof T]: T[K] extends (...args: never[]) => unknown
					? K extends 'url' | 'urn'
						? K | `${K} `
						: K
					: never
			}[keyof T]
	  > extends infer R
			? ParsedBox<([string] extends [R] ? IsoBox : Exclude<IsoBox, { type: R }>) | Box>
			: never)
