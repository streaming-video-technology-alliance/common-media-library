/**
 * Generate a random v4 UUID
 *
 * @returns A random v4 UUID
 *
 * @public
 */
export function uuid(): string {
	try {
		return crypto.randomUUID()
	}
	catch (error) {
		try {
			const url = URL.createObjectURL(new Blob())
			const uuid = url.toString()
			URL.revokeObjectURL(url)
			return uuid.slice(uuid.lastIndexOf('/') + 1)
		}
		catch (error) {
			const bytes = crypto.getRandomValues(new Uint8Array(16))
			bytes[6] = (bytes[6] & 0x0f) | 0x40
			bytes[8] = (bytes[8] & 0x3f) | 0x80

			const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
			return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`
		}
	}
}
