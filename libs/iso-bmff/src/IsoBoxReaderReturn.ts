import type { ParsedBox } from './ParsedBox.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'

/**
 * Return type for the ISO box reader.
 *
 * Creates a discriminated union of all box types returned by the readers,
 * plus ParsedBox for unknown/container boxes. This enables type narrowing
 * via `box.type === 'xxxx'`.
 *
 * @public
 */
export type IsoBoxReaderReturn<T> =
	| { [K in keyof T]: T[K] extends (...args: never[]) => infer R ? ParsedBox<R> : never }[keyof T]
	| ParsedIsoBox;
