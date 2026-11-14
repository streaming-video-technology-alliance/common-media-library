import {
	assert,
	describe,
	it,
	readIsoBoxes,
	readPssh,
	writePssh,
	type ProtectionSystemSpecificHeaderBox,
} from '../util/box.ts'

const TYPE = [112, 115, 115, 104] // 'pssh'
const SYSTEM_ID = new Array<number>(16).fill(0xaa)
const KID_A = new Array<number>(16).fill(0x11)
const KID_B = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

// The bytes of a pssh box: size, type, version, flags, SystemID, then the fields after SystemID.
function psshBox(version: number, fields: number[]): Uint8Array {
	const size = 28 + fields.length

	return new Uint8Array([0, 0, 0, size, ...TYPE, version, 0, 0, 0, ...SYSTEM_ID, ...fields])
}

function pssh(version: number, kidCount: number, kid: number[]): ProtectionSystemSpecificHeaderBox {
	return {
		type: 'pssh',
		version,
		flags: 0,
		systemId: SYSTEM_ID,
		kidCount,
		kid,
		dataSize: 4,
		data: [1, 2, 3, 4],
	}
}

describe('writePssh', function () {
	it('should write the 16 bytes of one key ID in a version 1 box', function () {
		// #region example
		const writer = writePssh({
			type: 'pssh',
			version: 1,
			flags: 0,
			systemId: [
				0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa,
				0xaa,
			],
			kidCount: 1,
			kid: [
				0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11,
				0x11,
			],
			dataSize: 4,
			data: [1, 2, 3, 4],
		})

		// size (56), type (pssh), version and flags, SystemID, KID_count (1),
		// the 16 bytes of the KID, DataSize (4), then the Data
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 56, 112, 115, 115, 104, 1, 0, 0, 0, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa,
				0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0, 0, 0, 1, 0x11, 0x11, 0x11, 0x11, 0x11,
				0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0, 0, 0, 4, 1, 2, 3, 4,
			]),
		)
		// #endregion example
	})

	it('should write the 32 bytes of two key IDs in a version 1 box', function () {
		const writer = writePssh(pssh(1, 2, [...KID_A, ...KID_B]))

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			psshBox(1, [0, 0, 0, 2, ...KID_A, ...KID_B, 0, 0, 0, 4, 1, 2, 3, 4]),
		)
	})

	it('should write a version 1 box with no key ID', function () {
		const writer = writePssh(pssh(1, 0, []))

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			psshBox(1, [0, 0, 0, 0, 0, 0, 0, 4, 1, 2, 3, 4]),
		)
	})

	it('should write a version 0 box', function () {
		const writer = writePssh(pssh(0, 0, []))

		assert.deepStrictEqual(new Uint8Array(writer.buffer), psshBox(0, [0, 0, 0, 4, 1, 2, 3, 4]))
	})

	for (const [name, input] of [
		['a version 1 box with one key ID', psshBox(1, [0, 0, 0, 1, ...KID_A, 0, 0, 0, 4, 1, 2, 3, 4])],
		[
			'a version 1 box with two key IDs',
			psshBox(1, [0, 0, 0, 2, ...KID_A, ...KID_B, 0, 0, 0, 4, 1, 2, 3, 4]),
		],
		['a version 1 box with one key ID and no data', psshBox(1, [0, 0, 0, 1, ...KID_A, 0, 0, 0, 0])],
		['a version 1 box with no key ID', psshBox(1, [0, 0, 0, 0, 0, 0, 0, 4, 1, 2, 3, 4])],
		['a version 0 box', psshBox(0, [0, 0, 0, 4, 1, 2, 3, 4])],
	] as const) {
		it(`should write the source bytes of ${name} that readPssh parsed`, function () {
			const [parsed] = readIsoBoxes(input, { readers: { pssh: readPssh } })

			assert.strictEqual(parsed.type, 'pssh')
			assert.deepStrictEqual(new Uint8Array(writePssh(parsed).buffer), input)
		})
	}
})
