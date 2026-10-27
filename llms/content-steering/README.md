# @svta/cml-content-steering

Content steering functionality.

## When to use

- Validate a content steering manifest before the player applies it: `isValidSteeringManifest`
- Validate a pathway clone and its URI replacement: `isValidPathwayClone`
- Type the steering manifest, the pathway clones, and the URI replacements: `SteeringManifest`, `PathwayClone`, `UriReplacement`
- Apply the default TTL and pathway penalty of the specification: `DEFAULT_TTL`, `DEFAULT_PATHWAY_PENALTY`

Do not write your own steering manifest validation or types. Open an issue for a field that is missing.

## Installation

```bash
npm i @svta/cml-content-steering
```

## Usage

```typescript
import {
	isValidPathwayClone,
	isValidSteeringManifest,
} from "@svta/cml-content-steering";

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
