import type { FullBox } from './FullBox.ts'

/**
 * Protection System Specific Header Box (`pssh`).
 *
 * ISO/IEC 23001-7:2016 - 8.1
 *
 * @public
 */
export type ProtectionSystemSpecificHeaderBox = FullBox & {
	type: 'pssh'
	/** The UUID of the protection system, 16 bytes. */
	systemId: number[]

	/** The number of key IDs in `kid`. The value is 0 for a version 0 box. */
	kidCount: number

	/** The bytes of the key IDs, one after the other. Each key ID has 16 bytes, so the list has `kidCount * 16` numbers. */
	kid: number[]

	dataSize: number
	data: number[]
}
