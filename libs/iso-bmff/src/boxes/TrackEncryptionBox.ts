import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 23001-7:2016 - 8.2 Track Encryption Box
 *
 * @public
 */
export type TrackEncryptionBox = FullBox & {
	type: 'tenc'

	/**
	 * The 3 bytes that precede `default_Per_Sample_IV_Size`. The lowest byte is
	 * `default_isProtected`. In a box of version 1 or above, the middle byte is the pattern.
	 * `writeTenc` writes `default_isProtected` from this field.
	 */
	defaultIsEncrypted: number

	/** `default_Per_Sample_IV_Size` */
	defaultIvSize: number

	/** `default_KID` */
	defaultKid: number[]

	/**
	 * `default_isProtected`: 1 for a protected track, 0 for a track that is not protected.
	 * `readTenc` sets the field to the lowest byte of `defaultIsEncrypted`. `writeTenc` does
	 * not write the field. To change the protection state, change `defaultIsEncrypted`.
	 */
	defaultIsProtected?: number

	/**
	 * `default_crypt_byte_block`, from 0 to 15. `readTenc` sets the field for a box of version 1
	 * or above. `writeTenc` writes the field to a box of version 1 or above. With no field,
	 * `writeTenc` writes the bits of `defaultIsEncrypted`.
	 */
	defaultCryptByteBlock?: number

	/**
	 * `default_skip_byte_block`, from 0 to 15. `readTenc` sets the field for a box of version 1
	 * or above. `writeTenc` writes the field to a box of version 1 or above. With no field,
	 * `writeTenc` writes the bits of `defaultIsEncrypted`.
	 */
	defaultSkipByteBlock?: number

	/**
	 * `default_constant_IV_size`. `readTenc` sets the field when `default_isProtected` is 1,
	 * `defaultIvSize` is 0, and the box has the byte. `writeTenc` writes the constant IV when
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
