/**
 * A timestamp map is a mapping of MPEG timestamps to local timestamps.
 *
 * @group WebVTT
 *
 * @beta
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc8216#section-3.5 | RFC 8216}
 */
export type TimestampMap = {
	MPEGTS: number;
	LOCAL: number;
};
