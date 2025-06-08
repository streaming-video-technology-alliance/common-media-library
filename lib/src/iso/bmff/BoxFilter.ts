import type { AnyBox } from './boxes/AnyBox.js';

/**
 * BoxFilter
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type BoxFilter = (box: AnyBox) => boolean;
