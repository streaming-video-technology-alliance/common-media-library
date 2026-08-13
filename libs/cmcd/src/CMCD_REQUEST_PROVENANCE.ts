/**
 * The `customData` key under which `CmcdReporter.createRequestReport()`
 * stamps session provenance on every request it returns.
 *
 * The value is an opaque token naming the session that issued the request;
 * `CmcdReporter.recordResponseReceived()` reads it to attribute a late
 * response to that session. Spread and `Object.assign` carry the token
 * through ordinary request clones, but `JSON.stringify` and structured
 * clone drop symbol-keyed properties: read the token before such a
 * boundary and restore it verbatim afterward. Never fabricate or alter a
 * token; a value the reporter did not write attributes by the `sid`
 * fallback chain instead.
 *
 * Backed by the symbol registry so duplicated copies of this library in
 * one bundle interoperate. The registry key is stable across versions.
 *
 * @public
 */
export const CMCD_REQUEST_PROVENANCE: unique symbol = /* @__PURE__ */ Symbol.for('@svta/cml-cmcd/request-provenance')
