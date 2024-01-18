export type ParsedValue<T> = {
	value: T;
	src: string;
}

export function parsedValue<T>(value: T, src: string): ParsedValue<T> {
	return { value, src };
}
