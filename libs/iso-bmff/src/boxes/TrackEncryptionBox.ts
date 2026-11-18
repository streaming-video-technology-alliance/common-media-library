import type { FullBox } from './FullBox.ts'

/**
 * Track Encryption Box (`tenc`).
 *
 * ISO/IEC 23001-7:2016 - 8.2
 *
 * @public
 */
export type TrackEncryptionBox = FullBox & {
	type: 'tenc'

	/** `default_Per_Sample_IV_Size` */
	defaultPerSampleIvSize: number

	/** `default_KID`: the default key ID, 16 bytes. */
	defaultKid: number[]

	/** `default_isProtected`: 1 for a protected track, 0 for a track that is not protected. */
	defaultIsProtected: number

	/**
	 * `default_crypt_byte_block`, from 0 to 15. `readTenc` sets the field for a box of version 1
	 * or above. `writeTenc` writes the field to a box of version 1 or above. With no field,
	 * `writeTenc` writes 0.
	 */
	defaultCryptByteBlock?: number

	/**
	 * `default_skip_byte_block`, from 0 to 15. `readTenc` sets the field for a box of version 1
	 * or above. `writeTenc` writes the field to a box of version 1 or above. With no field,
	 * `writeTenc` writes 0.
	 */
	defaultSkipByteBlock?: number

	/**
	 * `default_constant_IV_size`. `readTenc` sets the field when `default_isProtected` is 1,
	 * `defaultPerSampleIvSize` is 0, and the box has the byte. `writeTenc` writes the constant IV when
	 * the box has this field or `defaultConstantIv`. With no field, the size is the length of
	 * `defaultConstantIv`.
	 */
	defaultConstantIvSize?: number

	/**
	 * `default_constant_IV`. `writeTenc` writes `defaultConstantIvSize` bytes, with a 0 for
	 * each byte that the array does not have.
	 */
	defaultConstantIv?: number[]
}
