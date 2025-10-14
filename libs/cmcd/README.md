# @svta/cml-cmcd

Common Media Client Data (CMCD) encoding and decoding.

## Installation

```bash
npm i @svta/cml-cmcd
```

## Usage

```typescript
import { CmcdReportingMode, encodeCmcd } from "@svta/cml-cmcd";

const input = {
	br: 1000,
	"com.example-hello": "world",
	ec: ["ERR001", "ERR002"],
	su: true,
};
const options = { version: 2, reportingMode: CmcdReportingMode.REQUEST };
const result = encodeCmcd(input, options);
// result === 'br=1000,com.example-hello="world",ec=("ERR001" "ERR002"),su,v=2'
```
