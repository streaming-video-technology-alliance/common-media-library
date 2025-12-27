import type { IsoBmffBox } from './boxes/types/IsoBmffBox.ts'

/**
 * Box filter function
 *
 * @public
 */
export type IsoBoxFilter<T extends IsoBmffBox> = ((box: IsoBmffBox) => boolean) | ((box: IsoBmffBox) => box is T);
