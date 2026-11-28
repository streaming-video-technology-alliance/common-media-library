import type { IsoBoxReaderMap } from './IsoBoxReaderMap.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoInt64Reader } from './IsoInt64Reader.ts'

/**
 * Configuration for `readIsoBoxes` and `createIsoBoxReadCursor`.
 *
 * The type parameter `V` is the type of every 64-bit integer field that the built-in readers return.
 * TypeScript infers `V` from the return type of the `int64` function.
 * The `int64` option is optional for `number` fields and required for `bigint` fields.
 * The type parameter `S` is the type of the `spans` option. With the literal `true`, every box of the result has the fields of `IsoBoxSpan`.
 *
 * @public
 */
export type IsoBoxReadConfig<V extends IsoInt64 = number, S extends boolean = boolean> = {
	/**
	 * Map of each box type to the reader of that box.
	 */
	readers?: NoInfer<IsoBoxReaderMap<V>>

	/**
	 * If `true`, every box of the result has the `start` and `end` fields of `IsoBoxSpan`: the first byte of the box header and the first byte after the box.
	 * The fields are byte offsets from the first byte of the data. With no option, a box has no position.
	 */
	spans?: S
} & ([V] extends [bigint]
	? {
			/**
			 * The function that reads every 64-bit integer field of the built-in readers.
			 */
			int64: IsoInt64Reader<V>
		}
	: {
			/**
			 * The function that reads every 64-bit integer field of the built-in readers.
			 * With no function, the readers return each field as a `number`.
			 */
			int64?: IsoInt64Reader<V>
		})
