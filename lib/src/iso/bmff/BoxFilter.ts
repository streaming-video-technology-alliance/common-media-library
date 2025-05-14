import type { Box } from './Box';

/**
 * BoxFilter
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type BoxFilter = (box: Box) => boolean;
