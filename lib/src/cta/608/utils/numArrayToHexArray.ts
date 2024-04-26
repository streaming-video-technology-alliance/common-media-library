
export const numArrayToHexArray = function (numArray: number[]): string[] {
	const hexArray: string[] = [];
	for (let j = 0; j < numArray.length; j++) {
		hexArray.push(numArray[j].toString(16));
	}

	return hexArray;
};
