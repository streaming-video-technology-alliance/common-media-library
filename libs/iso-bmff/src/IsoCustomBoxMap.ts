/**
 * Map of each custom box type to the type of that box. The map is empty.
 *
 * To add a box type, declare the interface again in a `declare module` block:
 *
 * ```ts
 * type CustomBox = { type: 'cstm'; value: number }
 *
 * declare module '@svta/cml-iso-bmff' {
 * 	interface IsoCustomBoxMap {
 * 		cstm: CustomBox
 * 	}
 * }
 * ```
 *
 * `IsoBoxMap` then has the box type. The result of `readIsoBoxes`, the readers map, the writers map, and the write functions have that box type too.
 * The declaration applies to every file of the program. Two declarations of one box type need the same type.
 * Do not declare `uuid` in this map. Declare the box types of `uuid` in `IsoCustomUuidBoxMap`.
 *
 * @example
 * {@includeCode ../test/IsoCustomBoxMap.test.ts#example}
 *
 * @public
 */
// oxlint-disable-next-line typescript/consistent-type-definitions, typescript/no-empty-object-type
export interface IsoCustomBoxMap {}
