import { assert, describe, it, readIsoBoxes, readPssh } from '../util/box.ts'

const TYPE = [112, 115, 115, 104] // 'pssh'
const SYSTEM_ID = new Array<number>(16).fill(0xaa)
const KID_A = new Array<number>(16).fill(0x11)
const KID_B = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

// The bytes of a pssh box: size, type, version, flags, SystemID, then the fields after SystemID.
function psshBox(version: number, fields: number[]): Uint8Array {
	const size = 28 + fields.length

	return new Uint8Array([0, 0, 0, size, ...TYPE, version, 0, 0, 0, ...SYSTEM_ID, ...fields])
}

describe('readPssh', function () {
	it('should read the 16 bytes of one key ID in a version 1 box', function () {
		// #region example
		// A version 1 pssh box: size, type, version and flags, SystemID, KID_count (1),
		// the 16 bytes of the KID, DataSize (4), then the Data.
		const bytes = new Uint8Array([
			0, 0, 0, 56, 112, 115, 115, 104, 1, 0, 0, 0, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa,
			0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0, 0, 0, 1, 0x11, 0x11, 0x11, 0x11, 0x11,
			0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0, 0, 0, 4, 1, 2, 3, 4,
		])
		const [pssh] = readIsoBoxes(bytes, { readers: { pssh: readPssh } })
		// #endregion example

		assert.ok(pssh)
		assert.strictEqual(pssh.type, 'pssh')
		assert.strictEqual(pssh.version, 1)
		assert.strictEqual(pssh.flags, 0)
		assert.deepStrictEqual(pssh.systemId, SYSTEM_ID)
		assert.strictEqual(pssh.kidCount, 1)
		assert.deepStrictEqual(pssh.kid, KID_A)
		assert.strictEqual(pssh.dataSize, 4)
		assert.deepStrictEqual(pssh.data, [1, 2, 3, 4])
	})

	it('should read the 32 bytes of two key IDs in a version 1 box', function () {
		const [pssh] = readIsoBoxes(
			psshBox(1, [0, 0, 0, 2, ...KID_A, ...KID_B, 0, 0, 0, 4, 1, 2, 3, 4]),
			{ readers: { pssh: readPssh } },
		)

		assert.ok(pssh)
		assert.strictEqual(pssh.type, 'pssh')
		assert.strictEqual(pssh.kidCount, 2)
		assert.deepStrictEqual(pssh.kid, [...KID_A, ...KID_B])
		assert.strictEqual(pssh.dataSize, 4)
		assert.deepStrictEqual(pssh.data, [1, 2, 3, 4])
	})

	it('should read a version 1 box with one key ID and no data', function () {
		const [pssh] = readIsoBoxes(psshBox(1, [0, 0, 0, 1, ...KID_A, 0, 0, 0, 0]), {
			readers: { pssh: readPssh },
		})

		assert.ok(pssh)
		assert.strictEqual(pssh.type, 'pssh')
		assert.strictEqual(pssh.kidCount, 1)
		assert.deepStrictEqual(pssh.kid, KID_A)
		assert.strictEqual(pssh.dataSize, 0)
		assert.deepStrictEqual(pssh.data, [])
	})

	it('should read a version 1 box with no key ID', function () {
		const [pssh] = readIsoBoxes(psshBox(1, [0, 0, 0, 0, 0, 0, 0, 4, 1, 2, 3, 4]), {
			readers: { pssh: readPssh },
		})

		assert.ok(pssh)
		assert.strictEqual(pssh.type, 'pssh')
		assert.strictEqual(pssh.version, 1)
		assert.deepStrictEqual(pssh.systemId, SYSTEM_ID)
		assert.strictEqual(pssh.kidCount, 0)
		assert.deepStrictEqual(pssh.kid, [])
		assert.strictEqual(pssh.dataSize, 4)
		assert.deepStrictEqual(pssh.data, [1, 2, 3, 4])
	})

	it('should read a version 0 box', function () {
		const [pssh] = readIsoBoxes(psshBox(0, [0, 0, 0, 4, 1, 2, 3, 4]), {
			readers: { pssh: readPssh },
		})

		assert.ok(pssh)
		assert.strictEqual(pssh.type, 'pssh')
		assert.strictEqual(pssh.version, 0)
		assert.deepStrictEqual(pssh.systemId, SYSTEM_ID)
		assert.strictEqual(pssh.kidCount, 0)
		assert.deepStrictEqual(pssh.kid, [])
		assert.strictEqual(pssh.dataSize, 4)
		assert.deepStrictEqual(pssh.data, [1, 2, 3, 4])
	})
})
