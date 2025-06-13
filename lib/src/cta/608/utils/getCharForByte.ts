import { specialCea608CharsCodes } from './specialCea608CharsCodes.js';

export function getCharForByte(byte: number): string {
	return String.fromCharCode(specialCea608CharsCodes[byte] || byte);
};
