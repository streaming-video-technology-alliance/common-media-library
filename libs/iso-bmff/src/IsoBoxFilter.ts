import type { IsoBox } from './boxes/IsoBox.ts'

/**
 * Box filter function
 *
 * @public
 */
export type IsoBoxFilter<T extends IsoBox> = ((box: IsoBox) => boolean) | ((box: IsoBox) => box is T);
