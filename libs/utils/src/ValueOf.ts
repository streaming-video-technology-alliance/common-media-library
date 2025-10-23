/**
 * Utility type to get the value of a given object type.
 *
 *
 * @beta
 */
export type ValueOf<T> = T[keyof T];
