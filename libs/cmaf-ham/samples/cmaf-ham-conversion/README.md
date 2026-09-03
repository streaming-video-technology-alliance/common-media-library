# cmaf-ham-conversion

This project demonstrates the CMAF-Ham library by converting and editing DASH and HLS manifests.

When you run `npm run dev`, the CMAF-Ham library creates different versions of the content in the `input/` folder. You can add new content to the `input/` folder to convert it between formats.

## Steps to run the script
1. Open a terminal in the **root folder** of the **common-media-library** project.
2. Run `npm ci` and then `npm run build`.
3. Go to the sample folder with `cd libs/cmaf-ham/samples/cmaf-ham-conversion`.
4. Execute `node src/index.ts`.
5. Check that a new `dist/` folder exists with the output files. Each subfolder contains:
   * `ham.json`: A JSON export of the Ham object.
   * `validations.json`: The validation results for each presentation of the content.
   * `main.m3u8`: The multivariant playlist of the HLS version of the content.
   * `main.mpd`: The Media Presentation Description (MPD) of the DASH version of the content.

## Play the output in a Web Player
Serve the `dist/` folder with a static web server that allows cross-origin requests. Then load a manifest URL in a player.

Steps to play the HLS content:
1. Open the [hls.js demo page](https://hlsjs.video-dev.org/demo/)
2. Load the URL of a `main.m3u8` file in the served `dist/` folder

Steps to play the DASH content:
1. Open the [dash.js test page](https://reference.dashif.org/dash.js/nightly/samples/dash-if-reference-player/index.html)
2. Load the URL of a `main.mpd` file in the served `dist/` folder

## Samples
The `input/` folder has seven CMAF sample manifests for the CMAF-Ham library. The table lists them.

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
1. Add new DASH or HLS content to the `./input/dash` or `./input/hls` folder.
2. Each folder inside `./input/dash` or `./input/hls` should contain only one content item.
3. For HLS content, name the multivariant playlist `main.m3u8` or `manifest.m3u8`.
