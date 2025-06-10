import type { IsoBmffBox } from './boxes/IsoBmffBox.js';

/**
 * Box filter function
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type BoxFilter<T extends IsoBmffBox> = ((box: IsoBmffBox) => boolean) | ((box: IsoBmffBox) => box is T);
