import { readUint } from './readUint.ts'

export function readTerminatedString(dataView: DataView, offset: number): string {
	let str = ''
	let cursor = offset

	while (cursor - dataView.byteOffset < dataView.byteLength) {
		const char = readUint(dataView, cursor, 1)
		if (char === 0) {
			break
		}

		str += String.fromCharCode(char)
		cursor++
	}

	return str
};
