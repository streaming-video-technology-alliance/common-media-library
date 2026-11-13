import type { IsoBoxReaderMap } from './IsoBoxReaderMap.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoInt64Reader } from './IsoInt64Reader.ts'

/**
 * ISO Box Read View configuration
 *
 * The type parameter `V` is the type of every 64-bit integer field that the built-in readers return.
 * TypeScript infers `V` from the return type of the `int64` function.
 * The `int64` option is optional for `number` fields and required for `bigint` fields.
 *
 * @public
 */
export type IsoBoxReadViewConfig<V extends IsoInt64 = number> = {
	/**
	 * A map of box parsers to their box types
	 */
	readers?: NoInfer<IsoBoxReaderMap<V>>
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
