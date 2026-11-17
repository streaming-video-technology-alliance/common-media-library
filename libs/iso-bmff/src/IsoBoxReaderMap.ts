import type { IsoBoxReader } from './IsoBoxReader.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * A map of box parsers to their box types
 *
 * @public
 */
export type IsoBoxReaderMap<V extends IsoInt64 = number> = Record<
	IsoBoxType,
	IsoBoxReader<unknown, IsoBoxType, V>
>
