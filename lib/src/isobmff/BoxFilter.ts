import type { Box } from './Box.js';

/**
 * BoxFilter
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type BoxFilter<T = any> = (box: Box<T>) => boolean;
