export function range(count: number, start = 0, inc = 1): number[] {
	const result = [];
	for (let i = start; i < count; i += inc) {
		result.push(i);
	}
	return result;
}
