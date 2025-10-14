import { stringToUint16 } from '@svta/cml-utils';

/**
 * Creates a UTF-16 encoded ArrayBuffer from a string.
 * @param input - The input string to encode.
 * @returns The UTF-16 encoded ArrayBuffer.
 */
export const stringToUtf16Buffer = (input: string): ArrayBuffer => stringToUint16(input).buffer as ArrayBuffer;
