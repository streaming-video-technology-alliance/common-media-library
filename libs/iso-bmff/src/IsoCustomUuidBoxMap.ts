/**
 * Map of each user type of a `uuid` box to the type of that box. The map is empty.
 *
 * A key is a UUID in lowercase hexadecimal digits with hyphens, as in `6d1d9b05-42d5-44e6-80e2-141daff757b2`.
 * A key with an uppercase digit compiles, but `createUuidReader` and `createUuidWriter` throw a `RangeError` for that key.
 * A box type has `type: 'uuid'` and the key as its `userType` field.
 * To add a user type, declare the interface again in a `declare module` block:
 *
 * ```ts
 * const TFXD = '6d1d9b05-42d5-44e6-80e2-141daff757b2'
 *
 * type TfxdBox = { type: 'uuid'; userType: typeof TFXD; fragmentDuration: number }
 *
 * declare module '@svta/cml-iso-bmff' {
 * 	interface IsoCustomUuidBoxMap {
 * 		[TFXD]: TfxdBox
 * 	}
 * }
 * ```
 *
 * `IsoBoxMap['uuid']` is then the union of the declared box types. The test `box.userType === key` narrows a `uuid` box to one box type.
 * The declaration applies to every file of the program. Two declarations of one user type need the same type.
 *
 * @example
 * {@includeCode ../test/createUuidReader.test.ts#example}
 *
 * @public
 */
// oxlint-disable-next-line typescript/consistent-type-definitions, typescript/no-empty-object-type
export interface IsoCustomUuidBoxMap {}
