export function isEmpty(value: unknown): boolean {
	return value == null || (typeof value === 'object' && Object.keys(value).length === 0);
}
