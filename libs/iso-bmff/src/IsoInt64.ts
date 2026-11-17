/**
 * The JavaScript type of a 64-bit integer field.
 *
 * The built-in readers return a `number` by default.
 * With `readInt64AsBigInt` in the `int64` option, they return a `bigint`.
 *
 * @public
 */
export type IsoInt64 = number | bigint
