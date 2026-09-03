# Common Media Library

A common library for media playback in JavaScript

Open source players such as [hls.js](https://github.com/video-dev/hls.js/), [dash.js](https://github.com/Dash-Industry-Forum/dash.js/), and [shaka-player](https://github.com/shaka-project/shaka-player) implement many of the same features independently. This duplication is especially common for standards-based features, such as ID3 parsing, 608 parsing, and CMCD. The players share the intent of these features but not the code. A bug fixed in one player can remain in the others. The goal of this library is to create one place where these utilities can be maintained and distributed.

## Project structure

This project is a monorepo with three workspaces: `libs`, `docs`, and `dev`. The `libs` workspace contains the individual libraries, which are published to npm. The `docs` workspace contains the documentation for all the libraries. The documentation is published as one site on GitHub Pages. The `dev` workspace is a private development server. The available libraries are:

- `@svta/cml-cmcd`
- `@svta/cml-cmsd`
- `@svta/cml-content-steering`
- `@svta/cml-cta`
- `@svta/cml-c2pa`
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

Install one of the libraries with npm:

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

Read the [API documentation](https://streaming-video-technology-alliance.github.io/common-media-library/).

## Community

If you need help with the Common Media Library, or if you want to talk with other members:

- [Join the Discord Server](https://discord.gg/g2c5vwGvUc)
- [See GitHub Discussions](https://github.com/streaming-video-technology-alliance/common-media-library/discussions)

## Contributing

The Common Media Library is free and open source. We welcome help of any kind: fixing bugs, improving documentation, or suggesting new features. Read the [contributing guide](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/CONTRIBUTING.md) for details. The [Streaming Video Technology Alliance (SVTA)](https://www.svta.org) Players and Playback working group oversees contributions and project decisions.

## Code of Conduct

This project has a [Contributor Code of Conduct](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/CODE_OF_CONDUCT.md). By participating in this project, you agree to follow its terms.

## Thanks

This project builds on the work of the open source community. Special thanks to the maintainers of [hls.js](https://github.com/video-dev/hls.js/), [dash.js](https://github.com/dash-industry-forum/dash.js/), [shaka-player](https://github.com/shaka-project/shaka-player), and [structured-field-values](https://github.com/Jxck/structured-field-values). Thanks also to the [Streaming Video Technology Alliance](https://www.svta.org/), the [DASH Industry Forum](https://dashif.org/), and the [CTA WAVE Project](https://www.cta.tech/Resources/Standards/WAVE-Project).
