import { assert, describe, isIsoBoxType, it, readIsoBoxes, readPssh } from '../util/box.ts'
import { KID_A, KID_B, psshBox, SYSTEM_ID } from '../util/psshBoxes.ts'

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
		assert.ok(isIsoBoxType('pssh', pssh))
		assert.strictEqual(pssh.version, 1)
		assert.strictEqual(pssh.flags, 0)
		assert.deepStrictEqual(pssh.systemId, new Uint8Array(SYSTEM_ID))
		assert.deepStrictEqual(pssh.kid, [new Uint8Array(KID_A)])
		assert.deepStrictEqual(pssh.data, new Uint8Array([1, 2, 3, 4]))
	})

	it('should read the 32 bytes of two key IDs in a version 1 box', function () {
		const [pssh] = readIsoBoxes(
			psshBox(1, [0, 0, 0, 2, ...KID_A, ...KID_B, 0, 0, 0, 4, 1, 2, 3, 4]),
			{ readers: { pssh: readPssh } },
		)

		assert.ok(pssh)
		assert.ok(isIsoBoxType('pssh', pssh))
		assert.deepStrictEqual(pssh.kid, [new Uint8Array(KID_A), new Uint8Array(KID_B)])
		assert.deepStrictEqual(pssh.data, new Uint8Array([1, 2, 3, 4]))
	})

	it('should read a version 1 box with one key ID and no data', function () {
		const [pssh] = readIsoBoxes(psshBox(1, [0, 0, 0, 1, ...KID_A, 0, 0, 0, 0]), {
			readers: { pssh: readPssh },
		})

		assert.ok(pssh)
		assert.ok(isIsoBoxType('pssh', pssh))
		assert.deepStrictEqual(pssh.kid, [new Uint8Array(KID_A)])
		assert.deepStrictEqual(pssh.data, new Uint8Array())
	})

	it('should read a version 1 box with no key ID', function () {
		const [pssh] = readIsoBoxes(psshBox(1, [0, 0, 0, 0, 0, 0, 0, 4, 1, 2, 3, 4]), {
			readers: { pssh: readPssh },
		})

		assert.ok(pssh)
		assert.ok(isIsoBoxType('pssh', pssh))
		assert.strictEqual(pssh.version, 1)
		assert.deepStrictEqual(pssh.systemId, new Uint8Array(SYSTEM_ID))
		assert.deepStrictEqual(pssh.kid, [])
		assert.deepStrictEqual(pssh.data, new Uint8Array([1, 2, 3, 4]))
	})

	it('should read a version 0 box', function () {
		const [pssh] = readIsoBoxes(psshBox(0, [0, 0, 0, 4, 1, 2, 3, 4]), {
			readers: { pssh: readPssh },
		})

		assert.ok(pssh)
		assert.ok(isIsoBoxType('pssh', pssh))
		assert.strictEqual(pssh.version, 0)
		assert.deepStrictEqual(pssh.systemId, new Uint8Array(SYSTEM_ID))
		assert.deepStrictEqual(pssh.kid, [])
		assert.deepStrictEqual(pssh.data, new Uint8Array([1, 2, 3, 4]))
	})

	it('should return views of the input for the byte fields', function () {
		const bytes = psshBox(1, [0, 0, 0, 1, ...KID_A, 0, 0, 0, 4, 1, 2, 3, 4])
		const [pssh] = readIsoBoxes(bytes, { readers: { pssh: readPssh } })

		assert.ok(isIsoBoxType('pssh', pssh))
		assert.strictEqual(pssh.systemId.buffer, bytes.buffer)
		assert.strictEqual(pssh.kid[0].buffer, bytes.buffer)
		assert.strictEqual(pssh.kid[0].byteOffset, 32)
		assert.strictEqual(pssh.data.buffer, bytes.buffer)
	})
})
