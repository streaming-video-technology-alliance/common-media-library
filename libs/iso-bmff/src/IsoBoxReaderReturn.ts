import type { Box } from './boxes/Box.ts'
import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { ParsedBox } from './ParsedBox.ts'

/**
 * Return type for the ISO box reader.
 *
 * Creates a discriminated union of all box types returned by the readers,
 * plus ParsedBox for unknown/container boxes. This enables type narrowing
 * via `box.type === 'xxxx'`.
 *
 * The type parameter `V` is the type of the 64-bit integer fields of the built-in box types.
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
 * TypeScript does not instantiate a generic reader that the map holds in a variable.
 * The return type of that reader is then the built-in box type with `number | bigint` fields.
 * The union replaces that type with the built-in box type with `V` fields.
 *
 * @public
 */
export type IsoBoxReaderReturn<T, V extends IsoInt64 = number> =
	| NonNullable<
			{
				[K in keyof T]: NonNullable<T[K]> extends (...args: never[]) => infer B
					? ParsedBox<
							[B] extends [{ type: infer N extends keyof IsoBoxMap }]
								? [B] extends [IsoBoxMap<IsoInt64>[N]]
									? [IsoBoxMap<IsoInt64>[N]] extends [B]
										? IsoBoxMap<V>[N]
										: B
									: B
								: B,
							V
						>
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
			? ParsedBox<([string] extends [R] ? IsoBox<V> : Exclude<IsoBox<V>, { type: R }>) | Box, V>
			: never)
