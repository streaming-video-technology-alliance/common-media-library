# Common Media Library

A common library for media playback in JavaScript

Open source players such as [hls.js](https://github.com/video-dev/hls.js/), [dash.js](https://github.com/Dash-Industry-Forum/dash.js/), and [shaka-player](https://github.com/shaka-project/shaka-player) implement many of the same features independently. This duplication is especially common for standards-based features, such as ID3 parsing, 608 parsing, and CMCD. The players share the intent of these features but not the code. A bug fixed in one player can remain in the others. The goal of this library is to create one place where these utilities can be maintained and distributed.

## Documentation

Read the [documentation](https://cml.svta.org/packages/) on the website. Every package has a page with the overview, the guides, the API reference, and the changelog.

Guides:

- [Getting started](https://cml.svta.org/guide/getting-started)
- [CML and coding agents](https://cml.svta.org/guide/llms)
- `@svta/cml-cmcd`: [User Guide](https://cml.svta.org/packages/cmcd/guides/user-guide), [Validation Guide](https://cml.svta.org/packages/cmcd/guides/validation-guide), [Report Recorder Guide](https://cml.svta.org/packages/cmcd/guides/report-recorder-guide)
- `@svta/cml-c2pa`: [Manifest Box Validation](https://cml.svta.org/packages/c2pa/guides/manifest-box-validation), [VSI/EMSG Validation](https://cml.svta.org/packages/c2pa/guides/vsi-validation), [VOD Merkle Validation](https://cml.svta.org/packages/c2pa/guides/merkle-validation), [Results and Error Codes](https://cml.svta.org/packages/c2pa/guides/results-and-error-codes)
- `@svta/cml-iso-bmff`: [Reading Boxes](https://cml.svta.org/packages/iso-bmff/guides/reading-boxes), [Writing Boxes](https://cml.svta.org/packages/iso-bmff/guides/writing-boxes), [Utilities](https://cml.svta.org/packages/iso-bmff/guides/utilities)

The [releases page](https://cml.svta.org/releases/) lists the changelog entries of every package.

## Install

Install one of the libraries with npm:

```bash
npm i @svta/cml-cmcd
```

The type declarations need TypeScript 5.7 or later.

## Usage

```typescript
import { appendCmcdQuery, CmcdObjectType } from "@svta/cml-cmcd";

const cmcd = {
	sid: "4f2867f2-b0fd-4db7-a3e0-cea7dff44cfb",
	cid: "cc002fc3-d9e1-418d-9a5f-3d0eac601882",
	d: 4004.37,
	ot: CmcdObjectType.VIDEO,
	["com.example-hello"]: "world",
};

const cmcdUrl = appendCmcdQuery("https://example.com/video/segment-1.m4s", cmcd);
console.log(cmcdUrl);
// https://example.com/video/segment-1.m4s?CMCD=cid%3D%22cc002fc3-d9e1-418d-9a5f-3d0eac601882%22%2Ccom.example-hello%3D%22world%22%2Cd%3D4004%2Cot%3Dv%2Csid%3D%224f2867f2-b0fd-4db7-a3e0-cea7dff44cfb%22%2Cv%3D2
```

## Coding agents

The repository ships a skill that tells a coding agent which package covers a media playback task. Install the skill in a player project:

```bash
npx skills add streaming-video-technology-alliance/common-media-library
```

Agents that read documentation from the web can begin with [llms.txt](https://cml.svta.org/llms.txt).

## Community

If you need help with the Common Media Library, or if you want to talk with other members:

- [Join the Discord Server](https://discord.gg/g2c5vwGvUc)
- [See GitHub Discussions](https://github.com/streaming-video-technology-alliance/common-media-library/discussions)

## Contributing

The Common Media Library is free and open source. We welcome help of any kind: fixing bugs, improving documentation, or suggesting new features. Read the [contributing guide](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/CONTRIBUTING.md) for details. The [SVTA](https://www.svta.org) Players and Playback working group oversees contributions and project decisions.

## Code of Conduct

This project has a [Contributor Code of Conduct](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/CODE_OF_CONDUCT.md). By participating in this project, you agree to follow its terms.

## Thanks

This project builds on the work of the open source community. Special thanks to the maintainers of [hls.js](https://github.com/video-dev/hls.js/), [dash.js](https://github.com/dash-industry-forum/dash.js/), [shaka-player](https://github.com/shaka-project/shaka-player), [video.js](https://github.com/videojs/video.js), and [structured-field-values](https://github.com/Jxck/structured-field-values). Thanks also to the [Streaming Video Technology Alliance](https://www.svta.org/), the [DASH Industry Forum](https://dashif.org/), and the [CTA WAVE Project](https://www.cta.tech/Resources/Standards/WAVE-Project).
