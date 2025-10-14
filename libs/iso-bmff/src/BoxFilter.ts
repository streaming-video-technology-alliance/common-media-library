import type { IsoBmffBox } from './boxes/IsoBmffBox.ts'

/**
 * Box filter function
 *
 *
 * @beta
 */
export type BoxFilter<T extends IsoBmffBox> = ((box: IsoBmffBox) => boolean) | ((box: IsoBmffBox) => box is T);
