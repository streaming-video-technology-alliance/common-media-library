import { writeUint } from './writeUint.ts'

export function writeTerminatedString(dataView: DataView, offset: number, value: string): void {
	if (value.length === 0) {
		return
	}

	let cursor = dataView.byteOffset + offset

	for (let c = 0, len = value.length; c < len; c++) {
		writeUint(dataView, cursor++, 8, value.charCodeAt(c))
	}

	writeUint(dataView, cursor, 1, 0)
}
