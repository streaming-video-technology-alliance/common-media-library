# @svta/cml-cmaf-ham

A collection of tools for working with Common Media Application Format - Hypothetical Application Model (CMAF-HAM).

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
