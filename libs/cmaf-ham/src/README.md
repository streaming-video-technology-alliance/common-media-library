0
0
# CMAF HAM

## Overview

HTTP Live Streaming (HLS) and Dynamic Adaptive Streaming over HTTP (DASH) are the two main video streaming technologies today. Users often need to convert between HLS and DASH, edit manifests, and read manifest structures in code.

The Common Media Application Format (CMAF) for segmented media (ISO/IEC 23000-19) defines one universal format for both. The format is based on the ISO Base Media File Format (ISO BMFF). CMAF also defines the Hypothetical Application Model (HAM), a framework that shows how streaming applications use CMAF segments and fragments. This project is based on the principles of the CMAF standard and the [Hypothetical Application Model](https://cdn.cta.tech/cta/media/media/resources/standards/cta-5005-a-final.pdf).

## Features

* On-demand conversion between HLS and DASH manifests through HAM: HLS to HAM, HAM to HLS, DASH to HAM, and HAM to DASH.
* Elementary Media Presentation queries.

## Usage

The examples show how to use the CMAF HAM module in TypeScript:

```typescript
import { hamToDash, hamToHls, hlsToHam } from "@svta/cml-cmaf-ham";

// Convert an HLS multivariant playlist and its media playlists to HAM, then back to HLS and to DASH.
function convertHls(mainPlaylist: string, mediaPlaylists: string[]) {
  const ham = hlsToHam(mainPlaylist, mediaPlaylists);
  return { hls: hamToHls(ham), dash: hamToDash(ham) };
}
```

```typescript
import { dashToHam, hamToDash, hamToHls } from "@svta/cml-cmaf-ham";

// Convert a DASH MPD to HAM, then back to DASH and to HLS.
function convertDash(mpd: string) {
  const ham = dashToHam(mpd);
  return { hls: hamToHls(ham), dash: hamToDash(ham) };
}
```

The library also offers presentation queries and track validation.

## Documentation

For the API reference and more examples, read the [API documentation](https://streaming-video-technology-alliance.github.io/common-media-library/).

## Contribution

Contributions are welcome. To report a bug, request a feature, or contribute code, open an issue or a pull request.

## License

This library uses the Apache 2.0 License. You may use, modify, and distribute it for commercial and non-commercial purposes. See the LICENSE file for details.
