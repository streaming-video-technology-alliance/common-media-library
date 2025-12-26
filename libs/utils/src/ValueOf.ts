/**
 * Utility type to get the value of a given object type.
 *
 * @public
 */
export type ValueOf<T> = T[keyof T];
