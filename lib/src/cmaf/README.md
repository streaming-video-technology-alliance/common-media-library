# CMAF HAM LIBRARY 

## Overview 


## Features 

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




