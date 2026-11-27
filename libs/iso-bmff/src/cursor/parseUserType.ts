import { failRange } from './failRange.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/**
 * Converts a UUID in lowercase hexadecimal digits with hyphens to its 16 bytes.
 *
 * @param name - The function, for the error message.
 * @param userType - The UUID.
 * @returns The 16 bytes.
 *
 * @throws RangeError if `userType` is not a UUID in lowercase hexadecimal digits with hyphens.
 *
 * @internal
 */
export function parseUserType(name: string, userType: string): Uint8Array {
	if (!UUID.test(userType)) {
		failRange(
			`${name}: a user type`,
			'a UUID in lowercase hexadecimal digits with hyphens',
			`"${userType}"`,
		)
	}

	const hex = userType.replace(/-/g, '')
	const bytes = new Uint8Array(16)

	for (let i = 0; i < 16; i++) {
		bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
	}

	return bytes
}
