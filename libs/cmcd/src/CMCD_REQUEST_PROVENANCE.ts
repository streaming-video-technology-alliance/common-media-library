/**
 * The `customData` property where `CmcdReporter.createRequestReport()`
 * writes session provenance on every request it returns.
 *
 * The value is a frozen `CmcdRequestProvenance` record. `sid` names the
 * session that issued the request. `cid` is the content id at the time the
 * request was issued. `data` is the request's per-call data as an encoded
 * CMCD string. `CmcdReporter.recordResponseReceived()` reads the record to
 * attribute a late response to its session and to rebuild the request-time
 * report keys.
 * Spread and `Object.assign` copy the record into ordinary request clones.
 * `JSON.stringify` and structured clone drop symbol-keyed properties. Before
 * either operation, read the value and restore it afterward. JSON preserves
 * the record's fields. Attribution uses the `sid` value rather than object
 * identity, so a parsed plain-object copy attributes correctly. For a record
 * naming a `sid` the reporter does not retain, the reporter drops the
 * response rather than reattributing it.
 *
 * The symbol registry provides the symbol, so duplicated copies of this
 * library in one bundle interoperate. The registry key is stable across
 * versions.
 *
 * @public
 */
export const CMCD_REQUEST_PROVENANCE: unique symbol = /* @__PURE__ */ Symbol.for('@svta/cml-cmcd/request-provenance')
