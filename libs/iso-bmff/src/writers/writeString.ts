import { writeUint } from './writeUint.ts'

export function writeString(dataView: DataView, offset: number, size: number, value: string): void {
	for (let c = 0; c < size; c++) {
		writeUint(dataView, offset + c, 1, value.charCodeAt(c))
	}
}
