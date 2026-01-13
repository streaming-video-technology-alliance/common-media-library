import type { IsoBoxWriteViewConfig } from './IsoBoxWriteViewConfig.ts'

/**
 * ISO box writer.
 *
 * @public
 */
export type IsoBoxWriter<B> = (box: B, config: IsoBoxWriteViewConfig) => ArrayBufferView;
