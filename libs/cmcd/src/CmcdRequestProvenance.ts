/**
 * The session-provenance record `CmcdReporter.createRequestReport()` writes
 * to `customData` under `CMCD_REQUEST_PROVENANCE`.
 *
 * `sid` names the session that issued the request.
 * `CmcdReporter.recordResponseReceived()` matches `sid` against the
 * reporter's retained sessions by value, never by object identity. A record
 * copy restored from JSON attributes the response to the same
 * session. Session identity depends on the caller's own `sid` values, which
 * CTA-5004-B expects to be unique per playback session. Reusing a `sid`
 * replaces the retained session with that `sid`. The reporter then
 * attributes late responses of the replaced session to the replacement.
 *
 * `cid` is the content id at the time the reporter created the record. A
 * `RESPONSE_RECEIVED` event reports this `cid` instead of the session's
 * current `cid`. A response that completes after a content change
 * keeps the content id of its request.
 *
 * `data` is the per-call data the request was created with, encoded as a
 * CMCD string. The reporter decodes it to rebuild the request-time report
 * keys for a `RESPONSE_RECEIVED` event. Any copy of the record
 * contains the caller's inputs. The reporter captures `data` before the
 * request `transform` and key filter run. `data` is also present
 * on requests the reporter does not decorate.
 *
 * The reporter freezes every record it creates. The record is constructible:
 * a hand-built request may include `{ sid }` to attribute the request to
 * that session. The reporter drops a record naming a `sid` it does not
 * retain.
 *
 * @public
 */
export type CmcdRequestProvenance = {
	readonly sid: string;
	readonly cid?: string;
	readonly data?: string;
}
