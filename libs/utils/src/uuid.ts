import { arrayBufferToUuid } from './arrayBufferToUuid.ts'

/**
 * Generate a random v4 UUID
 *
 * @returns A random v4 UUID
 *
 * @public
 *
 * @example
 * {@includeCode ../test/uuid.test.ts#example}
 */
export function uuid(): string {
	try {
		return crypto.randomUUID()
	}
	catch (error) {
		try {
			const bytes = crypto.getRandomValues(new Uint8Array(16))

			// Set the version (4) and variant (RFC 4122) bits
			bytes[6] = (bytes[6] & 0x0f) | 0x40
			bytes[8] = (bytes[8] & 0x3f) | 0x80

			return arrayBufferToUuid(bytes.buffer)
		}
		catch (error) {
			const url = URL.createObjectURL(new Blob())
			const uuid = url.toString()
			URL.revokeObjectURL(url)
			return uuid.slice(uuid.lastIndexOf('/') + 1)
		}
	}
}
