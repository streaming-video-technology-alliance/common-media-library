import { writeUint } from './writeUint.ts'

export function writeString(dataView: DataView, offset: number, value: string): void {
	for (let c = 0, len = value.length; c < len; c++) {
		writeUint(dataView, offset + c, 1, value.charCodeAt(c))
	}
}
