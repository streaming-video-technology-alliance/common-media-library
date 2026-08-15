/**
 * The `customData` key under which `CmcdReporter.createRequestReport()`
 * stamps session provenance on every request it returns.
 *
 * The value is a frozen `CmcdRequestProvenance` record: `sid` names the
 * session that issued the request, `cid` is the content id in effect when
 * the request was issued, and `data` carries the request's per-call data
 * as an encoded CMCD string. `CmcdReporter.recordResponseReceived()` reads
 * the record to attribute a late response to its session and to rebuild
 * the request-time report keys.
 * Spread and `Object.assign` carry the record through ordinary request
 * clones, but `JSON.stringify` and structured clone drop symbol-keyed
 * properties: read the value before such a boundary and restore it
 * afterward. The record itself survives JSON, and attribution is by the
 * `sid` value rather than object identity, so a revived plain-object copy
 * attributes exactly. A record naming a `sid` the reporter does not retain
 * drops the response rather than relabeling it.
 *
 * Backed by the symbol registry so duplicated copies of this library in
 * one bundle interoperate. The registry key is stable across versions.
 *
 * @public
 */
export const CMCD_REQUEST_PROVENANCE: unique symbol = /* @__PURE__ */ Symbol.for('@svta/cml-cmcd/request-provenance')
