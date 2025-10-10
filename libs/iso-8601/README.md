# @svta/cml-iso-8601

ISO 8601 date/time handling functionality.

## Installation

```bash
npm i @svta/cml-iso-8601
```

## Usage

```typescript
import { encodeIso8601Duration } from "@svta/cml-iso-8601/encodeIso8601Duration";
import { decodeIso8601Duration } from "@svta/cml-iso-8601/decodeIso8601Duration";

// Encode duration
const encoded = encodeIso8601Duration(3661);
// encoded === 'PT1H1M1S'

// Decode duration
const decoded = decodeIso8601Duration("PT1H1M1S");
// decoded === 3661
```
