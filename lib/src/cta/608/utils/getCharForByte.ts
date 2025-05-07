import { specialCea608CharsCodes } from './specialCea608CharsCodes.ts';

export const getCharForByte = function (byte: number): string {
	return String.fromCharCode(specialCea608CharsCodes[byte] || byte);
};
