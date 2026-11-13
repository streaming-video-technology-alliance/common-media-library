import {
	assert,
	describe,
	it,
	readIsoBoxes,
	readTenc,
	type TrackEncryptionBox,
} from '../util/box.ts'

const KID = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
const IV = [161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176]

// The bytes of a tenc box: size, type, then the body.
function tencBox(...body: number[]): Uint8Array {
	return new Uint8Array([0, 0, 0, 8 + body.length, 116, 101, 110, 99, ...body])
}

function read(bytes: Uint8Array): TrackEncryptionBox {
	const [tenc] = readIsoBoxes(bytes, { readers: { tenc: readTenc } })

	assert.ok(tenc)
	assert.strictEqual(tenc.type, 'tenc')

	return tenc
}

function fields(box: TrackEncryptionBox): Omit<TrackEncryptionBox, 'type'> {
	return {
		version: box.version,
		flags: box.flags,
		defaultIsEncrypted: box.defaultIsEncrypted,
		defaultIsProtected: box.defaultIsProtected,
		defaultIvSize: box.defaultIvSize,
		defaultKid: box.defaultKid,
		defaultCryptByteBlock: box.defaultCryptByteBlock,
		defaultSkipByteBlock: box.defaultSkipByteBlock,
		defaultConstantIvSize: box.defaultConstantIvSize,
		defaultConstantIv: box.defaultConstantIv,
	}
}

describe('readTenc', function () {
	it('should read the pattern and the constant IV of a version 1 box', function () {
		// #region example
		// A version 1 tenc box: size (49), type (tenc), version, flags, a reserved byte,
		// the pattern 1:9, default_isProtected (1), default_Per_Sample_IV_Size (0),
		// default_KID, default_constant_IV_size (16), then default_constant_IV.
		const bytes = new Uint8Array([
			0, 0, 0, 49, 116, 101, 110, 99, 1, 0, 0, 0, 0, 0x19, 1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
			12, 13, 14, 15, 16, 16, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174,
			175, 176,
		])
		const [tenc] = readIsoBoxes(bytes, { readers: { tenc: readTenc } })

		assert.strictEqual(tenc.type, 'tenc')
		assert.strictEqual(tenc.defaultIsProtected, 1)
		assert.strictEqual(tenc.defaultIvSize, 0)
		assert.strictEqual(tenc.defaultCryptByteBlock, 1)
		assert.strictEqual(tenc.defaultSkipByteBlock, 9)
		assert.strictEqual(tenc.defaultConstantIvSize, 16)
		assert.deepStrictEqual(
			tenc.defaultConstantIv,
			[161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176],
		)
		// #endregion example

		assert.deepStrictEqual(fields(tenc), {
			version: 1,
			flags: 0,
			defaultIsEncrypted: 0x001901,
			defaultIsProtected: 1,
			defaultIvSize: 0,
			defaultKid: KID,
			defaultCryptByteBlock: 1,
			defaultSkipByteBlock: 9,
			defaultConstantIvSize: 16,
			defaultConstantIv: IV,
		})
	})

	it('should read the constant IV of a version 0 box', function () {
		const tenc = read(tencBox(0, 0, 0, 0, 0, 0, 1, 0, ...KID, 8, ...IV.slice(0, 8)))

		assert.deepStrictEqual(fields(tenc), {
			version: 0,
			flags: 0,
			defaultIsEncrypted: 1,
			defaultIsProtected: 1,
			defaultIvSize: 0,
			defaultKid: KID,
			defaultCryptByteBlock: undefined,
			defaultSkipByteBlock: undefined,
			defaultConstantIvSize: 8,
			defaultConstantIv: IV.slice(0, 8),
		})
	})

	it('should read no pattern and no constant IV from a version 0 box with an IV for each sample', function () {
		const tenc = read(tencBox(0, 0, 0, 0, 0, 0, 1, 8, ...KID))

		assert.deepStrictEqual(fields(tenc), {
			version: 0,
			flags: 0,
			defaultIsEncrypted: 1,
			defaultIsProtected: 1,
			defaultIvSize: 8,
			defaultKid: KID,
			defaultCryptByteBlock: undefined,
			defaultSkipByteBlock: undefined,
			defaultConstantIvSize: undefined,
			defaultConstantIv: undefined,
		})
	})

	it('should read the pattern and no constant IV from a version 1 box with an IV for each sample', function () {
		const tenc = read(tencBox(1, 0, 0, 0, 0, 0x5a, 1, 16, ...KID))

		assert.deepStrictEqual(fields(tenc), {
			version: 1,
			flags: 0,
			defaultIsEncrypted: 0x005a01,
			defaultIsProtected: 1,
			defaultIvSize: 16,
			defaultKid: KID,
			defaultCryptByteBlock: 5,
			defaultSkipByteBlock: 10,
			defaultConstantIvSize: undefined,
			defaultConstantIv: undefined,
		})
	})

	it('should read no constant IV from a box that is not protected', function () {
		const tenc = read(tencBox(1, 0, 0, 0, 0, 0, 0, 0, ...KID, 8, ...IV.slice(0, 8)))

		assert.deepStrictEqual(fields(tenc), {
			version: 1,
			flags: 0,
			defaultIsEncrypted: 0,
			defaultIsProtected: 0,
			defaultIvSize: 0,
			defaultKid: KID,
			defaultCryptByteBlock: 0,
			defaultSkipByteBlock: 0,
			defaultConstantIvSize: undefined,
			defaultConstantIv: undefined,
		})
	})

	it('should read a constant IV of 0 bytes', function () {
		const tenc = read(tencBox(0, 0, 0, 0, 0, 0, 1, 0, ...KID, 0))

		assert.strictEqual(tenc.defaultConstantIvSize, 0)
		assert.deepStrictEqual(tenc.defaultConstantIv, [])
	})

	it('should read no constant IV from a protected box of 32 bytes with a defaultIvSize of 0', function () {
		// A free box follows the tenc box.
		const bytes = new Uint8Array([
			...tencBox(0, 0, 0, 0, 0, 0, 1, 0, ...KID),
			0,
			0,
			0,
			12,
			102,
			114,
			101,
			101,
			16,
			...IV.slice(0, 3),
		])
		const boxes = readIsoBoxes(bytes, { readers: { tenc: readTenc } })
		const [tenc, free] = boxes

		assert.strictEqual(boxes.length, 2)
		assert.strictEqual(free.type, 'free')
		assert.strictEqual(tenc.type, 'tenc')
		assert.deepStrictEqual(fields(tenc), {
			version: 0,
			flags: 0,
			defaultIsEncrypted: 1,
			defaultIsProtected: 1,
			defaultIvSize: 0,
			defaultKid: KID,
			defaultCryptByteBlock: undefined,
			defaultSkipByteBlock: undefined,
			defaultConstantIvSize: undefined,
			defaultConstantIv: undefined,
		})
	})

	it('should read the bytes that remain when the box ends before the end of the constant IV', function () {
		// default_constant_IV_size is 16, and the box has 8 bytes of the constant IV.
		// A free box follows the tenc box.
		const bytes = new Uint8Array([
			...tencBox(0, 0, 0, 0, 0, 0, 1, 0, ...KID, 16, ...IV.slice(0, 8)),
			0,
			0,
			0,
			16,
			102,
			114,
			101,
			101,
			...IV.slice(8),
		])
		const boxes = readIsoBoxes(bytes, { readers: { tenc: readTenc } })
		const [tenc] = boxes

		assert.strictEqual(boxes.length, 2)
		assert.strictEqual(tenc.type, 'tenc')
		assert.strictEqual(tenc.defaultConstantIvSize, 16)
		assert.deepStrictEqual(tenc.defaultConstantIv, IV.slice(0, 8))
	})
})
