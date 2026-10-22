# Getting started

Each package installs on its own. Install the one you need:

```bash
npm i @svta/cml-cmcd
```

Import the functions you use. Your bundler drops the rest.

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

## Peer dependencies

Some packages depend on other CML packages and declare them as peer dependencies. npm 7 and later installs peer dependencies for you. The package overview lists them.

## Next steps

- [Browse the packages](/packages/). Each package page has an overview, guides, the API reference, and the changelog.
- [Follow the releases](/releases/).
- Ask questions on [Discord](https://discord.gg/g2c5vwGvUc) or in [GitHub Discussions](https://github.com/streaming-video-technology-alliance/common-media-library/discussions).
