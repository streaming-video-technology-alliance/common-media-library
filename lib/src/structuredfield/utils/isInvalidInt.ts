export function isInvalidInt(value: number) {
	return value < -999999999999999 || 999999999999999 < value;
}
