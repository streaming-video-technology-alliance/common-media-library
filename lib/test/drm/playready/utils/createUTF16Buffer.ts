/**
 * Creates a UTF-16 encoded ArrayBuffer from a string.
 * @param input - The input string to encode.
 * @returns The UTF-16 encoded ArrayBuffer.
 */
export const createUTF16Buffer = (input: string): ArrayBuffer => Buffer.from(input, 'utf16le').buffer;
