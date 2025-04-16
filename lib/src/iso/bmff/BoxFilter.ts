import type { Box } from './Box.ts';

/**
 * BoxFilter
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type BoxFilter = (box: Box) => boolean;
