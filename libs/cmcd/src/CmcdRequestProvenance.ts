/**
 * The session-provenance record `CmcdReporter.createRequestReport()` stamps
 * on `customData` under `CMCD_REQUEST_PROVENANCE`.
 *
 * `token` is the opaque value naming the session that issued the request;
 * `CmcdReporter.recordResponseReceived()` classifies by the token value,
 * never by object identity, so a copy of the record that crosses a JSON
 * boundary attributes exactly once restored.
 *
 * `cmcd` is the request report as encoded on the wire. Decorated requests
 * carry it; the reporter decodes it to rebuild the request-time report data
 * for a `RESPONSE_RECEIVED` event, so the data survives any boundary the
 * record itself is carried across. The record is the only attribution key:
 * a response whose request lost it (and did not restore it) is dropped.
 *
 * The reporter freezes every record it mints. Treat it as opaque: carry it
 * and restore it, never fabricate or alter one.
 *
 * @public
 */
export type CmcdRequestProvenance = {
	readonly token: string;
	readonly cmcd?: string;
}
