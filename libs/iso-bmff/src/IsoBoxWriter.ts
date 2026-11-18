import type { IsoBoxWriteConfig } from './IsoBoxWriteConfig.ts'

/**
 * A function that writes one box to an `IsoBoxWriteView`. `writeIsoBoxes` calls the function for each box of its type.
 *
 * @public
 */
export type IsoBoxWriter<B> = (box: B, config: IsoBoxWriteConfig) => ArrayBufferView
