// The JUMBF user type of ISO 19566-5 as bytes. The source has the same value as a string: JUMBF_USER_TYPE.
export const JUMBF_UUID: readonly number[] = [
	0xd8, 0xfe, 0xc3, 0xd6, 0x1b, 0x0e, 0x48, 0x3c, 0x92, 0x97, 0x58, 0x28, 0x87, 0x7e, 0xc4, 0x81,
]

// The C2PA manifest user type as bytes. The source has the same value as a string: C2PA_MANIFEST_USER_TYPE.
export const C2PA_MANIFEST_UUID: readonly number[] = [
	0xd8, 0xfe, 0xc3, 0xd6, 0x1a, 0x96, 0x4f, 0x32, 0xa0, 0xf6, 0xf3, 0xec, 0xf9, 0x6c, 0x10, 0xea,
]

const UUID_TYPE = [0x75, 0x75, 0x69, 0x64]

// A copy of the bytes with the C2PA manifest user type in place of the JUMBF user type of each uuid box.
export function withManifestUserType(bytes: Uint8Array): Uint8Array {
	const copy = bytes.slice()
	let count = 0

	for (let i = 4; i + 16 <= copy.length; i++) {
		if (
			UUID_TYPE.every((byte, j) => copy[i - 4 + j] === byte) &&
			JUMBF_UUID.every((byte, j) => copy[i + j] === byte)
		) {
			copy.set(C2PA_MANIFEST_UUID, i)
			count++
		}
	}

	if (!count) throw new Error('The bytes have no JUMBF user type')

	return copy
}
