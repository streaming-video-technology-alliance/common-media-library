import type { RequestOrigin } from './RequestOrigin.ts'

/** Keyed by the `cmcd` record on a decorated request. An entry lives as long as the record. */
export const CMCD_REQUEST_ORIGINS: WeakMap<object, RequestOrigin> = /* @__PURE__ */ new WeakMap<object, RequestOrigin>()
