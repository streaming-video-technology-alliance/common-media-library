import type { Box } from './Box.ts'
import type { BoxType } from './BoxType.ts'

/**
 * Utility type to get just the fields of a box
 *
 *
 * @beta
 */
export type Fields<T> = Omit<T, Exclude<keyof Box<BoxType>, 'data'> | 'boxes'>;
