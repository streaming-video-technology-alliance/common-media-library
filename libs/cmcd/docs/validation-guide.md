---
title: Validation Guide
description: How to validate CMCD payloads
---

# CMCD Validation Guide

The `@svta/cml-cmcd` library provides a set of composable validation functions for verifying that CMCD payloads conform to the CTA-5004 (v1) and CTA-5004-A (v2) specifications. These are useful for validating payloads on the receiving end — for example, in an analytics server that collects CMCD event reports, or in a CDN log processor that inspects CMCD request data.

## Overview

There are three main validation functions, each targeting a different aspect of CMCD compliance:

| Function              | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `validateCmcd`        | Orchestrator — runs key, value, and structure checks        |
| `validateCmcdRequest` | Validates a `Request` or `HttpRequest` as request-mode data |
| `validateCmcdEvents`   | Validates a multi-line `text/cmcd` body as event-mode data  |

All validators return a `CmcdValidationResult`:

```typescript
type CmcdValidationResult = {
	valid: boolean; // true if zero errors (warnings are OK)
	issues: CmcdValidationIssue[];
};

type CmcdValidationIssue = {
	key?: string;
	message: string;
	severity: CmcdValidationSeverity; // 'error' | 'warning'
};
```

## Validating Event Report Payloads

A common use case is validating CMCD v2 event reports received via POST. The payload is typically a `text/cmcd` body containing newline-separated CMCD-encoded strings, or `application/json`.

### Using `validateCmcdEvents`

The `validateCmcdEvents` function accepts a raw CMCD string and validates it as an event-mode payload. It supports multi-line `text/cmcd` bodies directly — each non-empty line is validated independently and the results are merged. An empty payload (no non-empty lines) is treated as an error.

```typescript
import { validateCmcdEvents } from "@svta/cml-cmcd";

// Validate a complete text/cmcd POST body
const body = `e=ps,sid="session-1",ts=1700000000000,sta=p,v=2
e=t,sid="session-1",ts=1700000001000,bl=(5000),v=2`;

const result = validateCmcdEvents(body);

if (!result.valid) {
	console.error("Invalid CMCD event:", result.issues);
}
```

A single-line string works as well:

```typescript
import { validateCmcdEvents } from "@svta/cml-cmcd";

const result = validateCmcdEvents(
	'e=ps,sid="session-1",ts=1700000000000,sta=p,v=2',
);
```

### Parsing and Validating `text/cmcd` manually

The `validateCmcdEvents` function is designed to validate multi-line `text/cmcd` bodies directly. However, if you need to validate a single-line string, you can decode the CMCD string and validate the data manually (this is what `validateCmcdRequest` does internally).

```typescript
import { decodeCmcd, validateCmcd } from "@svta/cml-cmcd";

// Simulated POST body (text/cmcd)
const body = `e=ps,sid="session-1",ts=1700000000000,sta=p,v=2
e=t,sid="session-1",ts=1700000001000,bl=(5000),v=2`;

// Parse each line and validate
const lines = body.split("\n");

for (const line of lines) {
	const data = decodeCmcd(line);
	const result = validateCmcd(data, { reportingMode: "event" });

	if (!result.valid) {
		console.error("Invalid CMCD event:", result.issues);
	}
}
```

## Validating Request Mode Data

In request mode, CMCD data is attached to segment requests via query parameters or HTTP headers. The validator ensures that event-only and response-only keys are not present.

### Using `validateCmcdRequest`

The `validateCmcdRequest` function accepts a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object or an `HttpRequest` object from `@svta/cml-utils`. It checks for CMCD headers first — if any CMCD header shards are found, it delegates to `validateCmcdHeaders` for shard-placement verification. Otherwise, it extracts the `CMCD` query parameter from the URL.

```typescript
import { validateCmcdRequest } from "@svta/cml-cmcd";

// From a Request with CMCD headers
const request = new Request("https://cdn.example.com/seg.mp4", {
	headers: {
		"CMCD-Object": "br=5000,d=4000,ot=v",
		"CMCD-Request": "bl=25000",
		"CMCD-Session": 'sid="abc"',
	},
});
const headerResult = validateCmcdRequest(request);

// From a Request with CMCD in the query parameter
const queryRequest = new Request(
	"https://cdn.example.com/seg.mp4?CMCD=br%3D5000%2Cbl%3D25000",
);
const queryResult = validateCmcdRequest(queryRequest);

// From an HttpRequest object
const httpRequestResult = validateCmcdRequest({
	url: "https://cdn.example.com/seg.mp4?CMCD=br%3D5000%2Cbl%3D25000",
});
```

### From Query Parameters manually

The `validateCmcdRequest` function is designed to validate the `CMCD` query parameter from the URL. However, if you need to validate the `CMCD` query parameter manually, you can extract it from the URL and validate the data using the `validateCmcd` function.

```typescript
import { fromCmcdQuery, validateCmcd } from "@svta/cml-cmcd";

// Extract CMCD from a request URL's query string
const url = new URL(
	"https://cdn.example.com/seg.mp4?CMCD=br%3D5000%2Cbl%3D25000%2Cd%3D4000%2Cot%3Dv%2Csid%3D%22abc%22",
);

const data = fromCmcdQuery(url.searchParams);
const result = validateCmcd(data, { reportingMode: "request" });

if (!result.valid) {
	console.error("Invalid CMCD request data:", result.issues);
}
```

### From HTTP Headers manually

When CMCD is transmitted via HTTP headers, you can validate the headers manually using the `validateCmcdHeaders` function.

```typescript
import { validateCmcdHeaders } from "@svta/cml-cmcd";

// Pass raw header strings directly — decoding is handled internally.
// Request mode validation is applied automatically since headers are
// only used in request mode.
const result = validateCmcdHeaders({
	"CMCD-Object": "br=5000,d=4000,ot=v",
	"CMCD-Request": "bl=25000",
	"CMCD-Session": 'sid="abc",sf=d,st=v',
});

if (!result.valid) {
	// Issues may include shard placement errors and/or payload validation errors
	console.error("Validation issues:", result.issues);
}
```

## Version-Aware Validation

The validators automatically detect the CMCD version from the `v` key in the payload. If `v` is absent, version 1 is assumed per the spec. You can override this with the `version` option.

```typescript
import { validateCmcd } from "@svta/cml-cmcd";

// Version inferred from payload (v=2)
const v2Result = validateCmcd({ v: 2, br: [5000], sid: "abc" });

// Version explicitly set via options
const v1Result = validateCmcd({ br: 5000, sid: "abc" }, { version: 1 });
```

### Version-Specific Behavior

- **Key validation**: v2-only keys (e.g., `sta`, `ec`, `ab`) are rejected when validating as v1
- **Type validation**: Some keys have different types between versions. For example, `bl` is an integer in v1 but an inner list (array) in v2
- **Version key**: v2 payloads must include the `v` key; v1 payloads should omit it

## Handling Validation Results

### Errors vs Warnings

A payload is considered `valid` if it contains zero errors. Warnings indicate spec recommendations that are not strict violations.

```typescript
import { validateCmcd, CMCD_VALIDATION_SEVERITY_ERROR } from "@svta/cml-cmcd";

const result = validateCmcd({ v: 2, bl: [150], sid: "abc" });

// Separate errors from warnings
const errors = result.issues.filter(
	(i) => i.severity === CMCD_VALIDATION_SEVERITY_ERROR,
);
const warnings = result.issues.filter(
	(i) => i.severity !== CMCD_VALIDATION_SEVERITY_ERROR,
);

console.log(`Valid: ${result.valid}`);
console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`);

// bl=150 produces a warning (should be rounded to nearest 100)
// but the payload is still valid
```

### Logging Issues

```typescript
import { validateCmcdEvents } from "@svta/cml-cmcd";

function validateAndLog(body: string): boolean {
	const result = validateCmcdEvents(body);

	for (const issue of result.issues) {
		const level = issue.severity === "error" ? "ERROR" : "WARN";
		const key = issue.key ? `[${issue.key}] ` : "";
		console.log(`${level}: ${key}${issue.message}`);
	}

	return result.valid;
}
```

## Custom Keys

Custom keys (keys containing a hyphen, e.g., `com.example-mykey`) are recognized by all validators:

- `validateCmcdKeys` — accepts custom keys without error
- `validateCmcdValues` — checks that custom key values are strings with a max length of 64 characters, and that the key name contains a hyphen
- `validateCmcdHeaders` — allows custom keys in any header shard

```typescript
import { validateCmcdValues } from "@svta/cml-cmcd";

const result = validateCmcdValues({
	"com.example-debug": "enabled",
	"x-player-version": "2.1.0",
});

// result.valid === true
```

## References

- [CTA-5004-A: Common Media Client Data v2](https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-a.html)
- [CTA-5004: Common Media Client Data v1 (PDF)](https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf)
