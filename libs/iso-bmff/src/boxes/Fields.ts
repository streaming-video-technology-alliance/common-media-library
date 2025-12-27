import type { Box } from './Box.ts'

/**
 * Utility type to get just the fields of a box
 *
 * @public
 */
export type Fields<T> = Omit<T, Exclude<keyof Box, 'data'> | 'boxes'>;
