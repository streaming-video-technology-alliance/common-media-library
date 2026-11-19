import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxContainer } from './IsoBoxContainer.ts'
import type { IsoBoxMap } from './IsoBoxMap.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoRawBox } from './IsoRawBox.ts'

/**
 * The type of a box that `readIsoBoxes` returns for a readers map `T`.
 *
 * The union has the return type of each reader in the map, the container types, and `IsoRawBox`.
 * A built-in box type with no reader in the map is not in the union, because such a box is a raw box.
 * A container type whose reader the map replaces is not in the union either.
 * A `url` or `urn` key also replaces `'url '` or `'urn '`.
 * When a key is not a literal, such as `string` from a computed key, the union has every built-in box type.
 * A reader result with a `type` field that is not a literal, such as `string`, adds no member to the union.
 *
 * The type parameter `V` is the type of the 64-bit integer fields of the built-in box types.
 * TypeScript does not instantiate a generic reader that the map holds in a variable.
 * The return type of that reader is then the built-in box type with `number | bigint` fields.
 * The union replaces that type with the built-in box type with `V` fields.
 * A reader that returns `any` keeps `any`.
 *
 * @public
 */
export type IsoBoxReaderReturn<T, V extends IsoInt64 = number> =
	| NonNullable<
			{
				[K in keyof T]: NonNullable<T[K]> extends (...args: never[]) => infer B
					? 0 extends 1 & B
						? B
						: [B] extends [{ type: infer N extends keyof IsoBoxMap }]
							? [B] extends [IsoBoxMap<IsoInt64>[N]]
								? [IsoBoxMap<IsoInt64>[N]] extends [B]
									? IsoBoxMap<V>[N]
									: B
								: B
							: [B] extends [{ type: infer N extends string }]
								? string extends N
									? never
									: B
								: B
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
			? [string] extends [R]
				? IsoBox<V>
				: Exclude<IsoBoxContainer<V>, { type: R }>
			: never)
	| IsoRawBox
