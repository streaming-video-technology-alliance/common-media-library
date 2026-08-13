/**
 * The session-provenance record `CmcdReporter.createRequestReport()` stamps
 * on `customData` under `CMCD_REQUEST_PROVENANCE`.
 *
 * `token` is the opaque value naming the session that issued the request;
 * `CmcdReporter.recordResponseReceived()` classifies by the token value,
 * never by object identity, so a copy of the record that crosses a JSON
 * boundary attributes exactly once restored. The reporter freezes every
 * record it mints. Treat it as opaque: carry it and restore it, never
 * fabricate or alter one.
 *
 * A record rather than a bare string so future provenance members are
 * additive for code that already carries the value across serialization
 * boundaries.
 *
 * @public
 */
export type CmcdRequestProvenance = {
	readonly token: string;
}
