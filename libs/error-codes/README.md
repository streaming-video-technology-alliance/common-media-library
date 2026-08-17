# @svta/cml-error-codes

SVTA standardized streaming error codes.

A reference implementation of the SVTA2070: Standardized Error Codes specification: a universal, player-agnostic error code scheme for streaming playback. Codes are short integers whose thousands digits identify the error category (Playback, Network, Content Protection, ...) and whose last three digits identify the specific error, with HTTP statuses and IAB VAST error codes embedded directly into the scheme.

## Installation

```bash
npm i @svta/cml-error-codes
```

> **Note:** This package has a type-only peer dependency on `@svta/cml-utils`.

## Usage

```typescript
import assert from "node:assert";
import { getSvtaErrorCategory, SvtaErrorCategory, SvtaPlaybackErrorCode } from "@svta/cml-error-codes";

const code = SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN;

assert(code === 2001);
assert(getSvtaErrorCategory(code) === SvtaErrorCategory.PLAYBACK);
```

Every code is also exported as an individual constant for direct imports:

```typescript
import assert from "node:assert";
import { SVTA_RESOURCE_NOT_FOUND } from "@svta/cml-error-codes";

assert(SVTA_RESOURCE_NOT_FOUND === 3004);
```

### Embedding external error codes

HTTP response statuses embed into the Network category and IAB VAST error codes embed into the Advertising category:

```typescript
import assert from "node:assert";
import { httpStatusToSvtaErrorCode, vastErrorToSvtaErrorCode } from "@svta/cml-error-codes";

assert(httpStatusToSvtaErrorCode(404) === 3404);
assert(vastErrorToSvtaErrorCode(301) === 7301);
```

### Descriptions

Human readable descriptions for dashboards and log lines. `getSvtaErrorDescription` ships in its own module, so it adds nothing to bundles that do not use it:

```typescript
import assert from "node:assert";
import { getSvtaErrorDescription, SvtaPlaybackErrorCode } from "@svta/cml-error-codes";

assert(getSvtaErrorDescription(SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN) === "Video buffer underrun");
assert(getSvtaErrorDescription(3404) === "Received an HTTP 404 response");
```

## References

- [SVTA2070: Standardized Error Codes](https://www.svta.org/product/svta2070/)
- [IAB VAST 4.0 §2.3.6.3 Error Codes](https://www.iab.com/wp-content/uploads/2016/01/VAST_4-0_2016-01-21.pdf)
