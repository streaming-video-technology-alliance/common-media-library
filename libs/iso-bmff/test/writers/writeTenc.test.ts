import {
	isIsoBoxType,
	assert,
	createDefaultReaderConfig,
	createDefaultWriterConfig,
	describe,
	it,
	readIsoBoxes,
	readTenc,
	writeIsoBox,
	writeTenc,
	type TrackEncryptionBox,
} from '../util/box.ts'
import { IV, KID, tencBox } from '../util/tencBoxes.ts'

function tenc(fields: Partial<TrackEncryptionBox>): TrackEncryptionBox {
	return {
		type: 'tenc',
		version: 0,
		flags: 0,
		defaultIsProtected: 1,
		defaultPerSampleIvSize: 0,
		defaultKid: KID,
		...fields,
	}
}

function write(box: TrackEncryptionBox): Uint8Array {
	return new Uint8Array(writeTenc(box).buffer)
}

const SOURCES: [name: string, bytes: Uint8Array][] = [
	[
		'a version 1 box with a pattern and a constant IV of 16 bytes',
		tencBox(1, 0, 0, 0, 0, 0x19, 1, 0, ...KID, 16, ...IV),
	],
	[
		'a version 1 box with a pattern and an IV for each sample',
		tencBox(1, 0, 0, 0, 0, 0x5a, 1, 16, ...KID),
	],
	[
		'a version 0 box with a constant IV of 8 bytes',
		tencBox(0, 0, 0, 0, 0, 0, 1, 0, ...KID, 8, ...IV.slice(0, 8)),
	],
	['a version 0 box with an IV for each sample', tencBox(0, 0, 0, 0, 0, 0, 1, 8, ...KID)],
	['a version 0 box that is not protected', tencBox(0, 0, 0, 0, 0, 0, 0, 0, ...KID)],
	['a version 1 box that is not protected', tencBox(1, 0, 0, 0, 0, 0, 0, 0, ...KID)],
	['a box with a constant IV of 0 bytes', tencBox(0, 0, 0, 0, 0, 0, 1, 0, ...KID, 0)],
	[
		'a protected box of 32 bytes with a defaultPerSampleIvSize of 0',
		tencBox(0, 0, 0, 0, 0, 0, 1, 0, ...KID),
	],
]

describe('writeTenc', function () {
	it('should write the pattern and the constant IV of a version 1 box', function () {
		// #region example
		const writer = writeTenc({
			type: 'tenc',
			version: 1,
			flags: 0,
			defaultIsProtected: 1,
			defaultPerSampleIvSize: 0,
			defaultKid: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
			defaultCryptByteBlock: 1,
			defaultSkipByteBlock: 9,
			defaultConstantIvSize: 16,
			defaultConstantIv: [
				161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176,
			],
		})

		// size (49), type (tenc), version, flags, a reserved byte, the pattern 1:9,
		// default_isProtected (1), default_Per_Sample_IV_Size (0), default_KID,
		// default_constant_IV_size (16), then default_constant_IV
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 49, 116, 101, 110, 99, 1, 0, 0, 0, 0, 0x19, 1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
				11, 12, 13, 14, 15, 16, 16, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173,
				174, 175, 176,
			]),
		)
		// #endregion example
	})

	it('should write the constant IV of a version 0 box', function () {
		const bytes = write(tenc({ defaultConstantIvSize: 8, defaultConstantIv: IV.slice(0, 8) }))

		assert.deepStrictEqual(bytes, tencBox(0, 0, 0, 0, 0, 0, 1, 0, ...KID, 8, ...IV.slice(0, 8)))
	})

	it('should write 32 bytes for a box with no new field', function () {
		const bytes = write(tenc({ defaultPerSampleIvSize: 8 }))

		assert.deepStrictEqual(bytes, tencBox(0, 0, 0, 0, 0, 0, 1, 8, ...KID))
	})

	it('should write a pattern of 0:0 for a version 1 box with no pattern field', function () {
		const bytes = write(tenc({ version: 1, defaultPerSampleIvSize: 8 }))

		assert.deepStrictEqual(bytes, tencBox(1, 0, 0, 0, 0, 0, 1, 8, ...KID))
	})

	it('should write the pattern fields of a version 1 box', function () {
		const bytes = write(
			tenc({
				version: 1,
				defaultPerSampleIvSize: 8,
				defaultCryptByteBlock: 5,
				defaultSkipByteBlock: 10,
			}),
		)

		assert.deepStrictEqual(bytes, tencBox(1, 0, 0, 0, 0, 0x5a, 1, 8, ...KID))
	})

	it('should write 0 for a pattern field that the box does not have', function () {
		const crypt = write(tenc({ version: 1, defaultPerSampleIvSize: 8, defaultCryptByteBlock: 5 }))
		const skip = write(tenc({ version: 1, defaultPerSampleIvSize: 8, defaultSkipByteBlock: 10 }))

		assert.deepStrictEqual(crypt, tencBox(1, 0, 0, 0, 0, 0x50, 1, 8, ...KID))
		assert.deepStrictEqual(skip, tencBox(1, 0, 0, 0, 0, 0x0a, 1, 8, ...KID))
	})

	it('should write a pattern of 0:0 from pattern fields of 0', function () {
		const bytes = write(
			tenc({
				version: 1,
				defaultPerSampleIvSize: 8,
				defaultCryptByteBlock: 0,
				defaultSkipByteBlock: 0,
			}),
		)

		assert.deepStrictEqual(bytes, tencBox(1, 0, 0, 0, 0, 0, 1, 8, ...KID))
	})

	it('should not write the pattern fields of a version 0 box', function () {
		const bytes = write(
			tenc({ defaultPerSampleIvSize: 8, defaultCryptByteBlock: 1, defaultSkipByteBlock: 9 }),
		)

		assert.deepStrictEqual(bytes, tencBox(0, 0, 0, 0, 0, 0, 1, 8, ...KID))
	})

	it('should write a 0 for each byte that defaultConstantIv does not have', function () {
		const missing = write(tenc({ defaultConstantIvSize: 4 }))
		const short = write(tenc({ defaultConstantIvSize: 4, defaultConstantIv: [161, 162] }))

		assert.deepStrictEqual(missing, tencBox(0, 0, 0, 0, 0, 0, 1, 0, ...KID, 4, 0, 0, 0, 0))
		assert.deepStrictEqual(short, tencBox(0, 0, 0, 0, 0, 0, 1, 0, ...KID, 4, 161, 162, 0, 0))
	})

	it('should take the size from defaultConstantIv for a box with no defaultConstantIvSize', function () {
		const bytes = write(tenc({ defaultConstantIv: IV }))

		assert.deepStrictEqual(bytes, tencBox(0, 0, 0, 0, 0, 0, 1, 0, ...KID, 16, ...IV))
	})

	it('should write defaultConstantIvSize bytes of a longer defaultConstantIv', function () {
		const bytes = write(tenc({ defaultConstantIvSize: 8, defaultConstantIv: IV }))

		assert.deepStrictEqual(bytes, tencBox(0, 0, 0, 0, 0, 0, 1, 0, ...KID, 8, ...IV.slice(0, 8)))
	})

	it('should write defaultIsProtected', function () {
		const bytes = write(tenc({ defaultPerSampleIvSize: 8, defaultIsProtected: 0 }))

		assert.deepStrictEqual(bytes, tencBox(0, 0, 0, 0, 0, 0, 0, 8, ...KID))
	})

	it('should write 0 for the reserved byte of a box that readTenc reads', function () {
		const [parsed] = readIsoBoxes(tencBox(1, 0, 0, 0, 0x7f, 0x19, 1, 8, ...KID), {
			readers: { tenc: readTenc },
		})

		assert.ok(isIsoBoxType('tenc', parsed))
		assert.deepStrictEqual(write(parsed), tencBox(1, 0, 0, 0, 0, 0x19, 1, 8, ...KID))
	})

	it('should write a changed defaultIsProtected of a box that readTenc reads', function () {
		const [parsed] = readIsoBoxes(tencBox(0, 0, 0, 0, 0, 0, 1, 8, ...KID), {
			readers: { tenc: readTenc },
		})

		assert.ok(isIsoBoxType('tenc', parsed))

		parsed.defaultIsProtected = 0

		assert.deepStrictEqual(write(parsed), tencBox(0, 0, 0, 0, 0, 0, 0, 8, ...KID))
	})

	for (const [name, source] of SOURCES) {
		it(`should write the source bytes of ${name} that readTenc reads`, function () {
			const [parsed] = readIsoBoxes(source, { readers: { tenc: readTenc } })

			assert.ok(isIsoBoxType('tenc', parsed))
			assert.deepStrictEqual(write(parsed), source)
		})

		it(`should write the source bytes of ${name} with the default configurations`, function () {
			const [parsed] = readIsoBoxes(source, createDefaultReaderConfig())

			assert.deepStrictEqual(writeIsoBox(parsed, createDefaultWriterConfig()), source)
		})
	}
})
