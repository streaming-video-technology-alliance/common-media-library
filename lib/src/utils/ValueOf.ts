/**
 * Utility type to get the value of a given object type.
 *
 * @group Utils
 *
 * @beta
 */
export type ValueOf<T> = T[keyof T];
