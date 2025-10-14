import { specialCea608CharsCodes } from './specialCea608CharsCodes.ts'

export function getCharForByte(byte: number): string {
	return String.fromCharCode(specialCea608CharsCodes[byte] || byte)
};
