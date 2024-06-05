import { specialCea608CharsCodes } from './specialCea608CharsCodes.js';

export const getCharForByte = function (byte: number): string {
	return String.fromCharCode(specialCea608CharsCodes[byte] || byte);
};
