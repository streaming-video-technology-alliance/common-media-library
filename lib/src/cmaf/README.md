# CMAF HAM LIBRARY 

## Overview 

HLS and DASH are currently the two most popular video streaming technologies. Due to this, there are some challenges such as converting HLS to DASH (and vice versa), manipulating manifests as well as the need to programmatically understand the structure of these manifests.


Common Media Application Format (CMAF) for segmented media (ISO/IEC 23000-19) was created with the goal of simplifying content delivery by defining a universal format based on ISOBMFF. This standard also describes the [Hypothetical Application Model](https://cdn.cta.tech/cta/media/media/resources/standards/cta-5005-a-final.pdf), a framework that illustrates how CMAF segments and fragments can be used in real-world streaming applications. This library was based on this model.


## Features 

* Basic on-demand [HLS] ↔ [DASH] manifest conversion. This includes hls to ham, ham to hls, dash to ham and ham to dash.
* Basic Media Presentation querying.
* Track validation.

## Usage 

Here's a basic example of how to use CMAF HAM library.

```typescript

import {
  hamToHls,
  hamToDash
  hlsToHam,
  dashToHam,
  Presentation,
  Manifest,
  getTracksFromPresentation,
  validateTracks,
} from "@svta/common-media-library";


function checkTracksValidity(presentation: Presentation) {
  const validation = validateTracks(getTracksFromPresentation(presentation));
  console.log(
    "At least one segment: ",
    validation.description.atLeastOneSegment
  );
  console.log(
    "All the tracks have the same duration: ",
    validation.description.sameDuration
  );
  validation.tracksWithErrors.length > 0 &&
    console.log("Track IDs without segments: ", validation.tracksWithErrors);
  console.log("######### INPUT TRACKS VALIDATION ENDED ########\n");
  return validation;
}

function parseFromDash(input: string) {
  //Convert input to ham object.
  const hamObject = mpdToHam(input); 
  //Convert ham object to hls manifest.
  const hlsManifest = hamToHls(hamObject);
  //Convert ham object to dash manifest.
  const dashManifest = hamToDash(hamObject);
}

function parseFromHls(main: string, playlists: string[]) {
  // Convert hls to ham object.
  const hamObject = hlsToHam(mainManifest, ancillaryManifests);
  //Convert ham object to hls.
  const hlsManifest = hamToHls(hamObject);
  //Convert ham object to dash.
  const dashManifest = hamToDash(hamObject);
}
```

## Documentation

For detailed documentation, including API reference and usage examples, please refer to the official documentation.


## Contribution

Contributions are welcome! If you encounter any bugs, have feature requests, or want to contribute code improvements, feel free to open an issue or submit a pull request.

## License

This library is licensed under the Apache 2.0 License. You are free to use, modify, and distribute it for both commercial and non-commercial purposes. See the LICENSE file for details.
