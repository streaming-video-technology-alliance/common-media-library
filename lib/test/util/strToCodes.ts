export function strToCodes(str: string) {
	const result: number[] = [];
	for (let i = 0; i < str.length; i++) {
		result[i] = str.charCodeAt(i);
	}
	return result;
}
