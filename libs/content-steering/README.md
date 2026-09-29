# @svta/cml-content-steering

Content steering for HLS and DASH players. The package implements Pathway-based Content Steering. It has the Steering Manifest types, validators, a steering engine, and a function for pathway clones.

## Installation

```bash
npm i @svta/cml-content-steering
```

## Usage

### Steering engine

The engine requests the Steering Manifest, schedules the next request, and selects the pathway that the player applies.

```typescript
import { createSteeringEngine } from '@svta/cml-content-steering'

const manifest = { VERSION: 1, TTL: 300, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }

const engine = createSteeringEngine({
	protocol: 'hls',
	uri: 'https://steering.example.com/manifest.json',
	pathways: ['CDN-A', 'CDN-B'],
	pathway: 'CDN-A',
	requester: async (request) => ({ request, status: 200, data: JSON.stringify(manifest) }),
	getThroughput: () => 6000000,
	onPathwayChange: (pathway) => console.log(`apply ${pathway}`),
})

await engine.start() // apply CDN-B

engine.penalize() // apply CDN-A
engine.stop()
```

The example uses a requester that returns a fixed Steering Manifest. Without `requester`, the engine uses `fetch`.

### Pathway clones

`applyUriReplacement` builds a URI of a pathway clone from a URI of its base pathway.

```typescript
import { applyUriReplacement } from '@svta/cml-content-steering'

const replacement = { HOST: 'backup2.example.com', PARAMS: { token: 'dkfs1239414' } }

const uri = applyUriReplacement('https://example.com/some/path/to/file', replacement)

console.log(uri) // https://backup2.example.com/some/path/to/file?token=dkfs1239414
```

### Validation

```typescript
import { isValidPathwayClone, isValidSteeringManifest } from '@svta/cml-content-steering'

const pathwayClone = {
	'BASE-ID': 'pathway1',
	ID: 'clone1',
	'URI-REPLACEMENT': {
		HOST: 'example.com',
		PARAMS: {
			param1: 'value1',
		},
	},
}

const manifest = {
	VERSION: 1,
	TTL: 100,
	'PATHWAY-PRIORITY': ['pathway1', 'clone1'],
	'PATHWAY-CLONES': [pathwayClone],
}

console.log(isValidSteeringManifest(manifest)) // true
console.log(isValidPathwayClone(pathwayClone)) // true
```
