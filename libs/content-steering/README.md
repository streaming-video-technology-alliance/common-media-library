# @svta/cml-content-steering

Content steering functionality.

## Installation

```bash
npm i @svta/cml-content-steering
```

## Usage

```typescript
import { isValidSteeringManifest } from "@svta/cml-content-steering/isValidSteeringManifest";
import { isValidPathwayClone } from "@svta/cml-content-steering/isValidPathwayClone";

const manifest = {
	VERSION: 1,
	TTL: 100,
	"PATHWAY-PRIORITY": ["pathway1", "pathway2"],
	"PATHWAY-CLONES": [
		{
			"BASE-ID": "pathway1",
			ID: "clone1",
			"URI-REPLACEMENT": {
				HOST: "example.com",
				PARAMS: {
					param1: "value1",
					param2: "value2",
				},
			},
		},
	],
};

const pathwayClone = {
	"BASE-ID": "pathway1",
	ID: "clone1",
	"URI-REPLACEMENT": {
		HOST: "example.com",
		PARAMS: {
			param1: "value1",
			param2: "value2",
		},
	},
};

const isValidManifest = isValidSteeringManifest(manifest);
const isValidClone = isValidPathwayClone(pathwayClone);
```
