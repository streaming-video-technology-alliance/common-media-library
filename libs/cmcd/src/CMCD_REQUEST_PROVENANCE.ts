/**
 * The `customData` key under which `CmcdReporter.createRequestReport()`
 * stamps session provenance on every request it returns.
 *
 * The value is a frozen `CmcdRequestProvenance` record: `token` names the
 * session that issued the request, and on decorated requests `cmcd` carries
 * the request report as encoded on the wire.
 * `CmcdReporter.recordResponseReceived()` reads the record to attribute a
 * late response to its session and to rebuild the request-time report data.
 * Spread and `Object.assign` carry the record through ordinary request
 * clones, but `JSON.stringify` and structured clone drop symbol-keyed
 * properties: read the value before such a boundary and restore it
 * afterward. The record itself survives JSON, and attribution is by token
 * value rather than object identity, so a revived copy attributes exactly.
 * Never fabricate or alter one; a value the reporter did not write
 * attributes by the `sid` fallback chain instead.
 *
 * Backed by the symbol registry so duplicated copies of this library in
 * one bundle interoperate. The registry key is stable across versions.
 *
 * @public
 */
export const CMCD_REQUEST_PROVENANCE: unique symbol = /* @__PURE__ */ Symbol.for('@svta/cml-cmcd/request-provenance')
