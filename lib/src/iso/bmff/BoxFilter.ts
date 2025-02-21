import type { Box } from './Box.js';

/**
 * BoxFilter
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type BoxFilter = (box: Box) => boolean;
