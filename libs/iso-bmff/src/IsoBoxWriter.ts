import type { Fields } from './boxes/Fields.ts'

/**
 * ISO box writer.
 *
 * @public
 */
export type IsoBoxWriter<B> = (box: Fields<B>) => ArrayBufferView;
