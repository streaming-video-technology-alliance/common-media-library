# CMAF HAM 

## Overview 

HLS and DASH stand as the predominant video streaming technologies currently. Consequently, users often encounter challenges such as converting between HLS and DASH, manipulating manifests, and programmatically understanding manifest structures.

The Common Media Application Format (CMAF) for segmented media (ISO/IEC 23000-19) addresses these challenges by defining a universal format based on ISOBMFF. Additionally, it introduces the Hypothetical Application Model, a framework illustrating the practical usage of CMAF segments and fragments in streaming applications. This project is inspired by the principles outlined in the CMAF standard and the [Hypothetical Application Model] ([Hypothetical Application Model](https://cdn.cta.tech/cta/media/media/resources/standards/cta-5005-a-final.pdf)).

## Features 

* Fundamental on-demand conversion between [HLS] and [DASH] manifests, covering transformations such as HLS to HAM, HAM to HLS, DASH to HAM, and HAM to DASH.
* Elementary Media Presentation querying functionality.

## Usage 

Here's a simple demonstration illustrating how to use the features of the CMAF HAM module in TypeScript:

```typescript
import {
  hamToHls,
  hamToDash
  hlsToHam,
} from "@svta/common-media-library";

const hamObject = hlsToHam(mainHlsManifest, playListHlsManifests); // Convert HLS to HAM object
const hlsManifest = hamToHls(hamObject); // Convert HAM object to HLS manifest
const dashManifest = hamToDash(hamObject); // Convert HAM object to DASH manifest
```

```typescript
import {
  hamToDash,
  hamToHls,
  hlsToHam,
} from "@svta/common-media-library";

const hamObject = dashToHam(mainDashManifest); // Convert DASH to HAM object
const hlsManifest = hamToHls(hamObject); // Convert HAM object to HLS manifest
const dashManifest = hamToDash(hamObject); // Convert HAM object to DASH manifest

```

This example showcases how to leverage functionalities such as manifest conversion, presentation querying, and track validation offered by the CMAF HAM library in TypeScript.

## Documentation

For detailed documentation, including API reference and usage examples, please refer to the API documentation.

## Contribution

Contributions are welcome! If you encounter any bugs, have feature requests, or want to contribute code improvements, feel free to open an issue or submit a pull request.

## License

This library is licensed under the Apache 2.0 License. You are free to use, modify, and distribute it for both commercial and non-commercial purposes. See the LICENSE file for details.
