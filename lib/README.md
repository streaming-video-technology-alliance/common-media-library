# common-media-library
A common library for media playback in JavaScript

Looking at open source players like [hls.js](https://github.com/video-dev/hls.js/), [dash.js](https://github.com/Dash-Industry-Forum/dash.js/) and [shaka-player](https://github.com/shaka-project/shaka-player) there are common pieces of functionality that have been implemented independently, and sometimes copy and pasted, across the libraries. This is particularly true when looking at standards based features, like ID3 parsing, 608 parsing and CMCD. Since the functionality is shared in spirit but not implementation, they can fall out of sync where certain bugs are fixed in one player but not the others. The goal of this library is to create a single place where these utilities can be maintained and distributed.

## Project structure
This project is a mono-repo with three workspaces: `dev`, `lib` and `docs`. The lib package contains the compiled code for the library which is published to npm. The dev package contains code to develop and test the lib package and is not published to npm. The docs package contains the documentation for the library and is published to GitHub pages.

## Installation
```bash
npm install @scta/common-media-library
```

## Usage
```typescript
import { appendCmcdQuery, CmcdObjectType } from '@svta.org/common-media-library';

const url = 'https://example.com/playlist.m3u8';
const cmcd = {
	sid: '4f2867f2-b0fd-4db7-a3e0-cea7dff44cfb',
	cid: 'cc002fc3-d9e1-418d-9a5f-3d0eac601882',
	d: 324.69,
	ot: CmcdObjectType.MANIFEST,
	['com.example-hello']: 'world',
};

const cmcdUrl = appendCmcdQuery(cmcd, url);
console.log(cmcdUrl);
// https://example.com/playlist.m3u8?CMCD=cid%3D%22cc002fc3-d9e1-418d-9a5f-3d0eac601882%22%2Ccom.example-hello%3D%22world%22%2Cd%3D325%2Cot%3Dm%2Csid%3D%224f2867f2-b0fd-4db7-a3e0-cea7dff44cfb%22
```
