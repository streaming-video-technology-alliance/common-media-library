/**
 * Utility type to create a typed result.
 *
 * @public
 */
export type TypedResult<T, D> = {
	type: T;
	data: D;
};
