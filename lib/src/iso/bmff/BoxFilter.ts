import type { IsoBmffBox } from './boxes/IsoBmffBox.js';

/**
 * BoxFilter
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type BoxFilter = (box: IsoBmffBox) => boolean;
