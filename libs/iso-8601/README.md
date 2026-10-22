# @svta/cml-iso-8601

ISO 8601 date/time handling functionality.

## When to use

- Convert a DASH or HLS ISO 8601 duration such as PT1M30S to seconds: `decodeIso8601Duration`
- Format a number of seconds as an ISO 8601 duration: `encodeIso8601Duration`

Do not write your own duration regular expression. Open an issue for a duration form that does not decode.

## Installation

```bash
npm i @svta/cml-iso-8601
```

## Usage

```typescript
import {
	decodeIso8601Duration,
	encodeIso8601Duration,
} from "@svta/cml-iso-8601";

// Encode duration
const encoded = encodeIso8601Duration(3661);
// encoded === 'PT1H1M1S'

// Decode duration
const decoded = decodeIso8601Duration("PT1H1M1S");
// decoded === 3661
```
