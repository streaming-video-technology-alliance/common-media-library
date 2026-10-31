# @svta/cml-content-steering

Content steering for HLS and DASH players. The package implements Pathway-based Content Steering. It has the Steering Manifest types, validators, a steering engine, and a function for pathway clones.

## When to use

- Run the content steering client of a player, which requests the Steering Manifest, keeps the request schedule, and selects the pathway: `createSteeringEngine`
- Send the Steering Manifest requests with `fetch` when the player has no requester of its own: `fetchRequester`
- Build a URI of a pathway clone from a URI of its base pathway: `applyUriReplacement`
- Validate a content steering manifest before the player applies it: `isValidSteeringManifest`
- Validate a pathway clone and its URI replacement: `isValidPathwayClone`
- Type the steering manifest, the pathway clones, the URI replacements, the engine configuration, and the engine errors: `SteeringManifest`, `PathwayClone`, `UriReplacement`, `SteeringEngineConfig`, `SteeringError`
- Name the protocol and the error types with constants: `SteeringProtocol`, `SteeringErrorType`
- Apply the default TTL and pathway penalty of the specification: `DEFAULT_TTL`, `DEFAULT_PATHWAY_PENALTY`

Do not write your own steering client, manifest validation, or types. The engine implements the client rules of the HLS and DASH specifications. Open an issue for a rule or a field that is missing.

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

The example uses a requester that returns a fixed Steering Manifest. `fetchRequester` is a requester that uses `fetch`.

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
