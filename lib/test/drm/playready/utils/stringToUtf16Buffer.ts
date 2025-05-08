import { stringToUint16 } from '@svta/common-media-library/utils/stringToUint16.ts';

/**
 * Creates a UTF-16 encoded ArrayBuffer from a string.
 * @param input - The input string to encode.
 * @returns The UTF-16 encoded ArrayBuffer.
 */
export const stringToUtf16Buffer = (input: string): ArrayBuffer => stringToUint16(input).buffer as ArrayBuffer;
