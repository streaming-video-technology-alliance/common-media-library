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
 * A built-in box type whose reader `T` replaces is not part of the union, so
 * a custom reader narrows to its own return type only. `R` is the union of the
 * replaced box types, computed from `T`:
 *
 * - Every key whose value is a reader. An optional reader may be absent, so its
 *   key does not count.
 * - A `url` or `urn` key also replaces `'url '` or `'urn '`, because the view
 *   looks a reader up by the trimmed type as well.
 * - When `R` is not literal, such as `string` from a computed key, every
 *   built-in box type stays.
 *
 * `R` is a separate parameter so that the exclusion sees a resolved union of
 * literal types. A conditional type inside the `Exclude` check does not distribute.
 *
 * @public
 */
export type IsoBoxReaderReturn<
	T,
	R = NonNullable<
		{
			[K in keyof T]: T[K] extends (...args: never[]) => unknown
				? K extends 'url' | 'urn'
					? K | `${K} `
					: K
				: never
		}[keyof T]
	>,
> =
	| { [K in keyof T]: T[K] extends (...args: never[]) => infer B ? ParsedBox<B> : never }[keyof T]
	| ParsedBox<([string] extends [R] ? IsoBox : Exclude<IsoBox, { type: R }>) | Box>
