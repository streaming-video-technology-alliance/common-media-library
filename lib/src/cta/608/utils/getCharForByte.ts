import { specialCea608CharsCodes } from './specialCea608CharsCodes.js';


export const getCharForByte = function (byte: number): string {
	let charCode = byte;
	if (Object.prototype.hasOwnProperty.call(specialCea608CharsCodes, byte)) {
		charCode = specialCea608CharsCodes[byte];
	}

	return String.fromCharCode(charCode);
};
