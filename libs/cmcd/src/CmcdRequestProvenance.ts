/**
 * The session-provenance record `CmcdReporter.createRequestReport()` stamps
 * on `customData` under `CMCD_REQUEST_PROVENANCE`.
 *
 * `sid` names the session that issued the request and is the attribution
 * key: `CmcdReporter.recordResponseReceived()` resolves it against the
 * reporter's retained sessions by value, never by object identity, so a
 * copy of the record that crosses a JSON boundary attributes exactly once
 * restored. Session identity rides on the caller's own `sid` values, which
 * CTA-5004-B expects to be unique per playback session: reusing a `sid`
 * replaces the retained namesake, so late responses of the replaced
 * session relabel onto the replacement.
 *
 * `cid` is the content id that was current when the record was minted. A
 * `RESPONSE_RECEIVED` event reports it in place of the session's current
 * `cid`, so a response that completes after a content change keeps the
 * meaning it had when the request was issued.
 *
 * `data` is the per-call data the request was created with, encoded as a
 * CMCD string. The reporter decodes it to rebuild the request-time report
 * keys for a `RESPONSE_RECEIVED` event, so the caller's inputs survive any
 * boundary the record itself is carried across. It is captured before the
 * request `transform` and key filter run, so it also rides requests the
 * reporter does not decorate.
 *
 * The reporter freezes every record it mints. The record is constructible:
 * a hand-built request may carry `{ sid }` to attribute to that session.
 * A record naming a `sid` the reporter does not retain is dropped.
 *
 * @public
 */
export type CmcdRequestProvenance = {
	readonly sid: string;
	readonly cid?: string;
	readonly data?: string;
}
