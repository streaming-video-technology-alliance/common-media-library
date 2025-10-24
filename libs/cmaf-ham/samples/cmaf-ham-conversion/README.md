# cmaf-ham-conversion

This project aims to demonstrate and explore the functionalities of the CMAF-Ham library through the manipulation and conversion of DASH and HLS manifests.

When you run this project using the command `npm run dev`, different versions of the content in the `input/` folder will be created using the CMAF-Ham library. It's worth noting that it is possible to add new content to the `input` folder to transform between formats.

## Steps to run the script
1. Open a terminal in the **root folder** of the **common-media-library** project.
2. Run `npm ci` and then `npm run build`.
3. Go the cmaf-ham-conversion sample using `cd samples/cmaf-ham-conversion`.
4. Execute `npm run dev`.
5. Verify that a new folder called `dist/` is created with the output files created using the CMAF-Ham library. In each subfolder you will find:
   * `ham.json`: A JSON export of the Ham object.
   * `validations.json`: A JSON file containing the results of the validation for each presentation of the content.
   * `main.m3u8`: A the multivariant playlist of the HLS version of the content. 
   * `main.mpd`: The MPD of the DASH version of the content. 

## Play the output in a Web Player
After executing the script, use the command `npm run serve` to launch a web server with CORS enabled to serve the created manifests. By default it will run in [`http://localhost:3000/`](http://localhost:3000/)

Steps to play the HLS content:
1. Run `npm run serve`
2. Open the [hls.js demo page](https://hlsjs.video-dev.org/demo/)
3. Load the URL `http://localhost:3000/<sample>/<path>/main.m3u8`

Steps to play the DASH content:
1. Run `npm run serve`
2. Open the [dash.js test page](https://reference.dashif.org/dash.js/nightly/samples/dash-if-reference-player/index.html)
3. Load the URL `http://localhost:3000/<sample>/<path>/main.mpd`

## Samples
The folder `input` has 3 CMAF HLS and 4 CMAF DASH manifests samples ready to use with the CMAF-Ham library. 

| Sample content | Characteristics |
| -  | - |
| DASH sample-1 | CMAF, VOD, 1 Period, 1 video track , 1 audio track , SegmentList MPD |
| DASH sample-2 | CMAF, VOD, 1 Period, 7 video tracks h264, 7 video tracks h265, 1 audio track, 4 text tracks, SegmentTemplate MPD |
| DASH sample-3 | CMAF, VOD, 1 Period, 3 video tracks, 2 audio tracks, 2 text tracks,  SegmentBase MPD |
| DASH sample-4 | CMAF, VOD, 2 Periods, 3 video tracks each period, 2 audio tracks each period, SegmentTemplate MPD |
| HLS sample-1 | CMAF, VOD, 6 video tracks, 1 audio track |
| HLS sample-2 | CMAF, VOD, 3 video tracks, 2 audio tracks |
| HLS sample-3 | CMAF, VOD, 3 video tracks, 2 audio tracks, 2 text tracks |

## Adding new content
1. You can add new DASH or HLS content into the `./input/dash` or `./input/hls` folders. 
2. Each folder within `./input/dash` or `./input/hls` should contain only one content. 
3. In the case of HLS content, the multivariant playlist must be named either `main.m3u8` or `manifest.m3u8`.
