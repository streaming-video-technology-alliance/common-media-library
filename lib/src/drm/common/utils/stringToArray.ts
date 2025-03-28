export function stringToArray(str: string): Uint16Array {
	return new Uint16Array([...str].map(char => char.charCodeAt(0)));
}
