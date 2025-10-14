/**
 * @internal
 */
export type ParsedValue<T> = {
	value: T;
	src: string;
};

/**
 * @internal
 */
export function parsedValue<T>(value: T, src: string): ParsedValue<T> {
	return { value, src };
}
