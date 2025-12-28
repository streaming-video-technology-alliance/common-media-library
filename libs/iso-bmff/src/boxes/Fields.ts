/**
 * Utility type to get just the fields of a box
 *
 * @public
 */
export type Fields<T> = Omit<T, 'type' | 'boxes'>;
