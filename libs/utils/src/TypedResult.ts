/**
 * Utility type to create a typed result.
 *
 *
 * @beta
 */
export type TypedResult<T, D> = {
	type: T;
	data: D;
};
