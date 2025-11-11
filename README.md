# Common Media Library

A common library for media playback in JavaScript

Looking at open source players like [hls.js](https://github.com/video-dev/hls.js/), [dash.js](https://github.com/Dash-Industry-Forum/dash.js/), and [shaka-player](https://github.com/shaka-project/shaka-player) there are common pieces of functionality that have been implemented independently across the libraries. This is particularly true when looking at standards based features, like ID3 parsing, 608 parsing and CMCD. Since the functionality is shared in spirit but not implementation, they can fall out of sync where certain bugs are fixed in one player but not the others. The goal of this library is to create a single place where these utilities can be maintained and distributed.

## Project structure

This project is a mono-repo with the following workspaces: `libs` and `docs`. The `libs` package contains the individual libraries which are published to npm. The `docs` package contains the documentation for all of the libraries and is published as a single site to GitHub pages. The available libraries are:

- `@svta/cml-cmcd`
- `@svta/cml-cmsd`
- `@svta/cml-content-steering`
- `@svta/cml-cta`
- `@svta/cml-dash`
- `@svta/cml-drm`
- `@svta/cml-id3`
- `@svta/cml-iso-8601`
- `@svta/cml-iso-bmff`
- `@svta/cml-request`
- `@svta/cml-structured-field-values`
- `@svta/cml-throughput`
- `@svta/cml-utils`
- `@svta/cml-webvtt`
- `@svta/cml-xml`

## Install

Install one of the libraries via npm

```bash
npm i @svta/cml-cmcd
```

## Usage

```typescript
import { appendCmcdQuery, CmcdObjectType } from "@svta/cml-cmcd";

const cmcd = {
	sid: "4f2867f2-b0fd-4db7-a3e0-cea7dff44cfb",
	cid: "cc002fc3-d9e1-418d-9a5f-3d0eac601882",
	d: 324.69,
	ot: CmcdObjectType.MANIFEST,
	["com.example-hello"]: "world",
};

const cmcdUrl = appendCmcdQuery("https://example.com/playlist.m3u8", cmcd);
console.log(cmcdUrl);
// https://example.com/playlist.m3u8?CMCD=cid%3D%22cc002fc3-d9e1-418d-9a5f-3d0eac601882%22%2Ccom.example-hello%3D%22world%22%2Cd%3D325%2Cot%3Dm%2Csid%3D%224f2867f2-b0fd-4db7-a3e0-cea7dff44cfb%22
```

## Documentation

API docs can be found [here](https://streaming-video-technology-alliance.github.io/common-media-library/).

## Community

If you need help with anything related to the Common Media Library, or if you'd like to chat with other members directly:

- [Join the Discord Server](https://discord.gg/g2c5vwGvUc)
- [See GitHub Discussions](https://github.com/streaming-video-technology-alliance/common-media-library/discussions)

## Contributing

The Common Media Library is a free and open source library, and we appreciate any help you're willing to give - whether it's fixing bugs, improving documentation, or suggesting new features. Check out the [contributing guide](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/CONTRIBUTING.md) for more details. Contributions and project decisions are overseen by the [SVTA](https://www.svta.org) Players and Playback working group.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## Thanks

This project builds upon the work of the open source community. Special thanks to the maintainers of [hls.js](https://github.com/video-dev/hls.js/), [dash.js](https://github.com/dash-industry-forum/dash.js/), [shaka-player](https://github.com/shaka-project/shaka-player), and [structured-field-values](https://github.com/Jxck/structured-field-values) as well as organizations like the [Streaming Video Technology Alliance](https://www.svta.org/), [DASH Industry Forum](https://dashif.org/), and the [CTA WAVE Project](https://www.cta.tech/Resources/Standards/WAVE-Project).
