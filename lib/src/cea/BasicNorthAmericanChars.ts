/**
 * Basic North American char set deviates from ASCII with these exceptions.
 */
export const BasicNorthAmericanChars: Map<number, string> = new Map([
	[0x27, '’'], [0x2a, 'á'], [0x5c, 'é'], [0x5c, 'é'], [0x5e, 'í'], [0x5f, 'ó'],
	[0x60, 'ú'], [0x7b, 'ç'], [0x7c, '÷'], [0x7d, 'Ñ'], [0x7e, 'ñ'], [0x7f, '█'],
]);
