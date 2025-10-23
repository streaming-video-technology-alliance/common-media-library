import { readUint } from './readUint.ts'

export function readString(dataView: DataView, offset: number, length: number): string {
	let str = ''

	for (let c = 0; c < length; c++) {
		const cursor = offset + c
		const char = readUint(dataView, cursor, 1)
		str += String.fromCharCode(char)
	}

	return str
}
