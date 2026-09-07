# @svta/cml-error-codes

SVTA2070 standardized streaming error codes.

This package is the reference implementation of [SVTA2070: Standardized Error Codes](https://www.svta.org/product/svta2070/). The specification defines one error vocabulary for every video player. Each code is a short integer. The thousands digits identify the category, such as Playback or Network. The last three digits identify the specific error. HTTP response statuses and IAB VAST error codes embed into the scheme at their own values.

## Installation

```bash
npm i @svta/cml-error-codes
```

The package has one peer dependency, `@svta/cml-utils`. The package imports it only with `import type`, so nothing from it appears in the runtime output.

## Usage

Codes are grouped into one catalog per category. Each catalog is an `as const` object, so autocomplete lists the valid members:

```typescript
import assert from "node:assert";
import { getSvtaErrorCategory, SvtaErrorCategory, SvtaPlaybackErrorCode } from "@svta/cml-error-codes";

const code = SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN;

assert(code === 2001);
assert(getSvtaErrorCategory(code) === SvtaErrorCategory.PLAYBACK);
```

Every code is also an individual constant:

```typescript
import assert from "node:assert";
import { SVTA_RESOURCE_NOT_FOUND } from "@svta/cml-error-codes";

assert(SVTA_RESOURCE_NOT_FOUND === 3004);
```

### Embed external error codes

HTTP response statuses embed into the Network category. IAB VAST error codes embed into the Advertising category. The four-digit VAST error 1009 (empty VAST response) maps to 7999.

```typescript
import assert from "node:assert";
import { httpStatusToSvtaErrorCode, vastErrorToSvtaErrorCode } from "@svta/cml-error-codes";

assert(httpStatusToSvtaErrorCode(404) === 3404);
assert(vastErrorToSvtaErrorCode(301) === 7301);
assert(vastErrorToSvtaErrorCode(1009) === 7999);
```

The helpers never throw. Out-of-range input returns the unknown code of the target category, 3000 or 7000.

### Descriptions

`getSvtaErrorDescription` returns the specification text for a code. The function lives in its own module, so bundles that do not call it do not include the dictionary.

```typescript
import assert from "node:assert";
import { getSvtaErrorDescription, SvtaPlaybackErrorCode } from "@svta/cml-error-codes";

assert(getSvtaErrorDescription(SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN) === "Video buffer underrun");
assert(getSvtaErrorDescription(3404) === "Received an HTTP 404 response");
```

## References

- [SVTA2070: Standardized Error Codes](https://www.svta.org/product/svta2070/)
- [IAB VAST 4.0 §2.3.6.3 Error Codes](https://www.iab.com/wp-content/uploads/2016/01/VAST_4-0_2016-01-21.pdf)
