export function isInvalidInt(value: number): boolean {
	return value < -999999999999999 || 999999999999999 < value;
}
