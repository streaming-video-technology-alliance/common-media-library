CMAF HAM LIBRARY

Overview


Features

Usage
Here's a basic example of how to use [Library Name]:

import {
  hamToHls,
  hamToDash
  hlsToHam,
  mpdToHam,
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
  // Convert the input to HAM Object.
  const presentations = mpdToHam(input);
  const hlsManifest = hamToHls(presentations);
  const dashManifest = hamToDash(presentations);

}

function fromM3u8ToHam(main: string, playlists: string[]) {
  // Convert m3u8 to ham object
  const hamObject = m3u8ToHam(mainManifest, ancillaryManifests);
  console.log("M3U8 has been converted to ham object.");

  //Convert ham object to m3u8
  const hlsManifest = hamToM3U8(hamObject);
  console.log("m3u8 object has been created.");

  const dashManifest = hamToDash(hamObject);

}

Documentation
For detailed documentation, including API reference and usage examples, please refer to the official documentation.



Contribution
Contributions are welcome! If you encounter any bugs, have feature requests, or want to contribute code improvements, feel free to open an issue or submit a pull request.

License
This library is licensed under the Apache 2.0 License. You are free to use, modify, and distribute it for both commercial and non-commercial purposes. See the LICENSE file for details.

Acknowledgments
Special thanks to [list of contributors or acknowledgments].



