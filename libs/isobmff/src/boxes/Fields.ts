import type { Box } from './Box.js';

/**
 * Utility type to get just the fields of a box
 *
 *
 * @beta
 */
export type Fields<T> = Omit<T, Exclude<keyof Box, 'data'> | 'boxes'>;
