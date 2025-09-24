/**
 * Utility type to create a typed result.
 *
 * @group Utils
 *
 * @beta
 */
export type TypedResult<T, D> = {
	type: T;
	data: D;
};
