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
	/** The UUID of the protection system, 16 bytes. The reader returns a view of the input. */
	systemId: Uint8Array

	/**
	 * The key IDs, one 16-byte entry for each key ID. A box of version 0 has no key IDs.
	 * The writer writes the key IDs and their count only for version 1 or above.
	 */
	kid: Uint8Array[]

	/** The data of the protection system. The reader returns a view of the input. */
	data: Uint8Array
}
