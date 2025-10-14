export function numArrayToHexArray(numArray: number[]): string[] {
	const hexArray: string[] = []
	for (const num of numArray) {
		hexArray.push(num.toString(16))
	}

	return hexArray
};
