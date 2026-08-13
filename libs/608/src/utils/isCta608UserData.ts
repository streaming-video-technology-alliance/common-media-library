/**
 * The 8-byte ATSC A/53 user identifier that prefixes a `cc_data()` payload, per
 * ANSI-SCTE 128: `itu_t_t35_country_code` (0xB5, USA), `terminal_provider_code`
 * (0x0031, ATSC), `terminal_provider_oriented_code` ('GA94'), and
 * `user_data_type_code` (0x03, cc_data).
 *
 * Both carriage formats use it unchanged — an AVC/HEVC/VVC
 * `user_data_registered_itu_t_t35` SEI message and an AV1 `metadata_itu_t_t35` OBU — so
 * this identifies CTA-608 user data for either.
 *
 * @param raw - The DataView holding the T.35 payload
 * @param pos - The position of `itu_t_t35_country_code`
 * @returns true when the 8 bytes at `pos` identify CTA-608 caption data
 */
export function isCta608UserData(raw: DataView, pos: number): boolean {
	return raw.getUint8(pos) === 0xB5
		&& raw.getUint16(pos + 1) === 0x0031
		&& raw.getUint32(pos + 3) === 0x47413934
		&& raw.getUint8(pos + 7) === 0x03
}
