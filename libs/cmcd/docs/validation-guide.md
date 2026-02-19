---
title: Validation Guide
description: How to validate CMCD payloads
---

# CMCD Validation Guide

The `@svta/cml-cmcd` library provides a set of composable validation functions for verifying that CMCD payloads conform to the CTA-5004 (v1) and CTA-5004-A (v2) specifications. These are useful for validating payloads on the receiving end — for example, in an analytics server that collects CMCD event reports, or in a CDN log processor that inspects CMCD request data.

## Overview

There are five validation functions, each targeting a different aspect of CMCD compliance:

| Function                | Purpose                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `validateCmcd`          | Orchestrator — runs key, value, and structure checks               |
| `validateCmcdKeys`      | Checks that all keys are recognized spec keys or valid custom keys |
| `validateCmcdValues`    | Checks that values conform to expected types and constraints       |
| `validateCmcdStructure` | Checks structural rules (event mode, version key, reporting mode)  |
| `validateCmcdHeaders`   | Checks that keys are placed in the correct header shards           |

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

### Parsing and Validating `text/cmcd`

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

### Event Mode Structural Rules

When `reportingMode: 'event'` is specified, the structure validator enforces:

- The `e` (event type) key must be present
- The `ts` (timestamp) key must be present
- Custom events (`e="ce"`) require the `cen` (custom event name) key
- Play state events (`e="ps"`) require the `sta` (player state) key
- Error events (`e="e"`) require the `ec` (error codes) key
- Response received events (`e="rr"`) require the `url` key
- Response keys (`rc`, `ttfb`, `ttlb`, etc.) must only appear with `e="rr"`

```typescript
import { decodeCmcd, validateCmcdStructure } from "@svta/cml-cmcd";

const data = decodeCmcd('e=ps,sid="s1",ts=1700000000000');
const result = validateCmcdStructure(data, { reportingMode: "event" });

// result.valid === false
// result.issues:
//   { key: 'sta', message: 'Play state event (e="ps") requires the "sta" key...', severity: 'error' }
```

## Validating Request Mode Data

In request mode, CMCD data is attached to segment requests via query parameters or HTTP headers. The validator ensures that event-only and response-only keys are not present.

### From Query Parameters

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

### From HTTP Headers

```typescript
import { fromCmcdHeaders, validateCmcd } from "@svta/cml-cmcd";

// Extract CMCD from request headers
const headers = {
	"CMCD-Object": "br=5000,d=4000,ot=v",
	"CMCD-Request": "bl=25000,dl=20000",
	"CMCD-Session": 'sid="abc",sf=d,st=v',
	"CMCD-Status": "bs",
};

const data = fromCmcdHeaders(headers);
const result = validateCmcd(data, { reportingMode: "request" });

if (!result.valid) {
	console.error("Invalid CMCD request data:", result.issues);
}
```

### Request Mode Structural Rules

When `reportingMode: 'request'` is specified, the structure validator enforces:

- Event keys (`e`, `ts`, `cen`, `h`) must not be present
- Response keys (`rc`, `ttfb`, `ttfbb`, `ttlb`, `url`, `cmsdd`, `cmsds`, `smrt`) must not be present

```typescript
import { validateCmcdStructure } from "@svta/cml-cmcd";

const data = { br: 5000, e: "ps", ts: 1700000000000 };
const result = validateCmcdStructure(data, { reportingMode: "request" });

// result.valid === false
// result.issues:
//   { key: 'e', message: 'Event key "e" must not be present in request mode.', severity: 'error' }
//   { key: 'ts', message: 'Event key "ts" must not be present in request mode.', severity: 'error' }
```

## Validating Header Shard Placement

When CMCD is transmitted via HTTP headers, each key must be placed in its correct header shard (`CMCD-Object`, `CMCD-Request`, `CMCD-Session`, or `CMCD-Status`). Use `validateCmcdHeaders` to check this.

```typescript
import { decodeCmcd, validateCmcdHeaders } from "@svta/cml-cmcd";

// Decode each header shard individually
const headers = {
	"CMCD-Object": decodeCmcd("br=5000,d=4000,ot=v"),
	"CMCD-Request": decodeCmcd("bl=25000"),
	"CMCD-Session": decodeCmcd('sid="abc"'),
};

const result = validateCmcdHeaders(headers);

if (!result.valid) {
	// e.g., { key: 'sid', message: 'Key "sid" is in "CMCD-Object" but should be in "CMCD-Session".', severity: 'error' }
	console.error("Misplaced keys:", result.issues);
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

## Using Individual Validators

You can run individual validators when you only need specific checks:

```typescript
import {
	validateCmcdKeys,
	validateCmcdValues,
	validateCmcdStructure,
} from "@svta/cml-cmcd";

const data = { v: 2, br: [5000], bl: [25432], sid: "abc" };

// Check only key validity
const keysResult = validateCmcdKeys(data);
// keysResult.valid === true

// Check only value types and constraints
const valuesResult = validateCmcdValues(data);
// valuesResult.issues might include a warning: bl should be rounded to nearest 100

// Check only structural rules
const structureResult = validateCmcdStructure(data, { reportingMode: "event" });
// structureResult.valid === false (missing 'e' and 'ts')
```

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
import { decodeCmcd, validateCmcd } from "@svta/cml-cmcd";

function validateAndLog(cmcdString: string): boolean {
	const data = decodeCmcd(cmcdString);
	const result = validateCmcd(data, { reportingMode: "event" });

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
