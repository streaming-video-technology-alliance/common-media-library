import type { IsoBoxWriter } from './IsoBoxWriter.ts'

/**
 * Map of each box type to the writer of that box.
 *
 * @public
 */
export type IsoBoxWriterMap = Record<string, IsoBoxWriter<any>>
