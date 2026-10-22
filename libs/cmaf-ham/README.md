# @svta/cml-cmaf-ham

A collection of tools for working with Common Media Application Format - Hypothetical Application Model (CMAF-HAM).

## When to use

- Parse a DASH MPD into the CMAF-HAM presentation model: `dashToHam`
- Parse an HLS multivariant playlist into the CMAF-HAM presentation model: `hlsToHam`
- Convert one manifest format to the other through the model: `hamToDash`, `hamToHls`
- Collect the tracks of a presentation, a selection set, or a switching set: `getTracksFromPresentation`, `getTracksFromSelectionSet`, `getTracksFromSwitchingSet`
- Validate a presentation, a switching set, or a track: `validatePresentation`, `validateSwitchingSet`, `validateTrack`

Do not write your own DASH to HLS converter or manifest object model. Open an issue for a manifest feature that the model does not carry.

## Installation

```bash
npm i @svta/cml-cmaf-ham
```

## Usage

```typescript
import { dashToHam, hamToHls } from "@svta/cml-cmaf-ham";
import type { ManifestFile } from "@svta/cml-cmaf-ham";

// Convert a DASH MPD to HLS playlists through the HAM model.
function dashToHls(mpd: string): ManifestFile {
	const presentations = dashToHam(mpd);
	return hamToHls(presentations);
}
```
