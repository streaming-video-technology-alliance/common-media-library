/**
 * Special North American char set.
 * Note: Transparent Space is currently implemented as a regular space.
 */
export const SpecialNorthAmericanChars: Map<number, string> = new Map([
	[0x30, '®'], [0x31, '°'], [0x32, '½'], [0x33, '¿'], [0x34, '™'], [0x35, '¢'],
	[0x36, '£'], [0x37, '♪'], [0x38, 'à'], [0x39, '⠀'], [0x3a, 'è'], [0x3b, 'â'],
	[0x3c, 'ê'], [0x3d, 'î'], [0x3e, 'ô'], [0x3f, 'û'],
]);
