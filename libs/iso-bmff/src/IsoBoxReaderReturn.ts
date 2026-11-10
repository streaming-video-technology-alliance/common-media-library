import type { Box } from './boxes/Box.ts'
import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { ParsedBox } from './ParsedBox.ts'

/**
 * Return type for the ISO box reader.
 *
 * Creates a discriminated union of all box types returned by the readers,
 * plus ParsedBox for unknown/container boxes. This enables type narrowing
 * via `box.type === 'xxxx'`.
 *
 * A built-in box type whose reader `T` replaces is not part of the union, so
 * a custom reader narrows to its own return type only. When the keys of `T`
 * are not literal box types, such as `string`, every built-in box type stays.
 *
 * @public
 */
export type IsoBoxReaderReturn<T> =
	| { [K in keyof T]: T[K] extends (...args: never[]) => infer R ? ParsedBox<R> : never }[keyof T]
	| ParsedBox<([IsoBoxType] extends [keyof T] ? IsoBox : Exclude<IsoBox, { type: keyof T }>) | Box>
